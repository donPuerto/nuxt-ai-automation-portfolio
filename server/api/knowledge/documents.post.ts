import type { H3Event } from 'h3'
import { getSupabaseAdmin } from '../../utils/supabase-admin'
import { requireSupabaseUser } from '../../utils/knowledge-auth'
import {
  buildKnowledgeSummary,
  extractKnowledgeFileText,
  normalizeOptionalText,
  replaceDocumentChunks,
  uploadKnowledgeFile,
} from '../../utils/knowledge-indexing'

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

  if (sourceType === 'file' && !uploadedFile) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Upload a file to index this knowledge source.',
    })
  }

  const supabase = getSupabaseAdmin(event)
  let extractedContent = content
  let fileType = sourceType === 'file' ? (normalizeOptionalText(body.fileType) ?? 'pdf') : 'text'
  let fileName = sourceType === 'file' ? normalizeOptionalText(body.fileName) : null
  let storagePath = sourceType === 'file' ? normalizeOptionalText(body.storagePath) : null

  if (sourceType === 'file' && uploadedFile) {
    const extracted = await extractKnowledgeFileText(uploadedFile)
    extractedContent = extracted.content
    fileType = extracted.fileType
    fileName = uploadedFile.filename
  }

  const documentId = crypto.randomUUID()
  if (sourceType === 'file' && uploadedFile) {
    storagePath = await uploadKnowledgeFile({
      supabase,
      documentId,
      file: uploadedFile,
    })
  }

  const { data: document, error } = await supabase
    .from('documents')
    .insert({
      id: documentId,
      name,
      source: normalizeOptionalText(body.source),
      source_type: sourceType,
      file_type: fileType,
      file_name: fileName,
      storage_path: storagePath,
      summary: normalizeOptionalText(body.summary) ?? buildKnowledgeSummary(extractedContent ?? ''),
      status: body.status ?? 'indexed',
    })
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
        documentId: document.id,
        content: extractedContent,
        sourceType,
        fileName,
      })
    }
    catch (chunkError) {
      await supabase
        .from('documents')
        .update({ status: 'failed' })
        .eq('id', document.id)

      throw createError({
        statusCode: 500,
        statusMessage: chunkError instanceof Error ? chunkError.message : 'Unable to index knowledge source.',
      })
    }
  }

  return { document }
})
