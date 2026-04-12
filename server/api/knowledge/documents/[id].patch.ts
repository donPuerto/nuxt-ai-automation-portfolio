import type { H3Event } from 'h3'
import { getSupabaseAdmin } from '../../../utils/supabase-admin'
import { requireSupabaseUser } from '../../../utils/knowledge-auth'
import {
  buildKnowledgeSummary,
  extractKnowledgeFileText,
  normalizeOptionalText,
  removeKnowledgeFile,
  replaceDocumentChunks,
  uploadKnowledgeFile,
} from '../../../utils/knowledge-indexing'

type KnowledgeDocumentBody = {
  name?: string
  source?: string
  sourceType?: 'text' | 'file'
  fileType?: string
  fileName?: string
  storagePath?: string
  summary?: string
  status?: 'draft' | 'ready' | 'indexed' | 'failed'
  content?: string
}

const parseKnowledgeDocumentBody = async (event: H3Event) => {
  const contentType = getHeader(event, 'content-type') || ''

  if (contentType.includes('multipart/form-data')) {
    const form = await readMultipartFormData(event)
    const fields = new Map<string, string>()
    let uploadedFile: { filename: string, mimeType: string, data: Buffer } | null = null

    for (const part of form ?? []) {
      if (part.filename) {
        uploadedFile = {
          filename: part.filename,
          mimeType: part.type || 'application/octet-stream',
          data: part.data,
        }
        continue
      }

      if (part.name) {
        fields.set(part.name, part.data.toString('utf8'))
      }
    }

    return {
      body: {
        name: fields.get('name') ?? fields.get('title'),
        source: fields.get('source'),
        sourceType: fields.get('sourceType') as KnowledgeDocumentBody['sourceType'],
        fileType: fields.get('fileType'),
        fileName: fields.get('fileName') ?? uploadedFile?.filename,
        storagePath: fields.get('storagePath'),
        summary: fields.get('summary'),
        status: fields.get('status') as KnowledgeDocumentBody['status'],
        content: fields.get('content'),
      } satisfies KnowledgeDocumentBody,
      uploadedFile,
    }
  }

  return {
    body: (await readBody<KnowledgeDocumentBody>(event)) ?? {},
    uploadedFile: null,
  }
}

export default defineEventHandler(async (event) => {
  await requireSupabaseUser(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Document id is required.',
    })
  }

  const { body, uploadedFile } = await parseKnowledgeDocumentBody(event)
  const name = normalizeOptionalText(body.name)
  const sourceType = body.sourceType === 'file' ? 'file' : 'text'
  const content = normalizeOptionalText(body.content)

  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Knowledge title is required.',
    })
  }

  if (sourceType === 'text' && !content) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Text knowledge needs content.',
    })
  }

  const supabase = getSupabaseAdmin(event)
  const { data: existingDocument, error: existingDocumentError } = await supabase
    .from('documents')
    .select('id,status,file_name,storage_path,file_type')
    .eq('id', id)
    .single()

  if (existingDocumentError || !existingDocument) {
    throw createError({
      statusCode: 404,
      statusMessage: existingDocumentError?.message || 'Knowledge source not found.',
    })
  }

  let extractedContent = content
  let fileType = sourceType === 'file'
    ? (normalizeOptionalText(body.fileType) ?? existingDocument.file_type ?? 'pdf')
    : 'text'
  let fileName = sourceType === 'file'
    ? (normalizeOptionalText(body.fileName) ?? existingDocument.file_name)
    : null
  let storagePath = sourceType === 'file'
    ? (normalizeOptionalText(body.storagePath) ?? existingDocument.storage_path)
    : null
  let nextStatus = body.status ?? existingDocument.status ?? 'indexed'

  if (sourceType === 'file' && uploadedFile) {
    const extracted = await extractKnowledgeFileText(uploadedFile)
    extractedContent = extracted.content
    fileType = extracted.fileType
    fileName = uploadedFile.filename
    const nextStoragePath = await uploadKnowledgeFile({
      supabase,
      documentId: id,
      file: uploadedFile,
    })
    if (existingDocument.storage_path && existingDocument.storage_path !== nextStoragePath) {
      await removeKnowledgeFile({
        supabase,
        storagePath: existingDocument.storage_path,
      })
    }
    storagePath = nextStoragePath
    nextStatus = 'indexed'
  }

  if (sourceType === 'text' && extractedContent) {
    nextStatus = body.status ?? 'indexed'
  }

  const { data: document, error } = await supabase
    .from('documents')
    .update({
      name,
      source: normalizeOptionalText(body.source),
      source_type: sourceType,
      file_type: fileType,
      file_name: fileName,
      storage_path: storagePath,
      summary: normalizeOptionalText(body.summary) ?? buildKnowledgeSummary(extractedContent ?? ''),
      status: nextStatus,
    })
    .eq('id', id)
    .select('id,name,source,file_type,source_type,file_name,storage_path,summary,status,created_at,updated_at')
    .single()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  if (extractedContent) {
    try {
      await replaceDocumentChunks({
        supabase,
        documentId: id,
        content: extractedContent,
        sourceType,
        fileName,
      })
    }
    catch (chunkError) {
      await supabase
        .from('documents')
        .update({ status: 'failed' })
        .eq('id', id)

      throw createError({
        statusCode: 500,
        statusMessage: chunkError instanceof Error ? chunkError.message : 'Unable to re-index knowledge source.',
      })
    }
  }

  return { document }
})
