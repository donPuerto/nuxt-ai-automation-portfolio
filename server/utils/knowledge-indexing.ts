import { PDFParse } from 'pdf-parse'
import type { SupabaseClient } from '@supabase/supabase-js'

type KnowledgeSourceType = 'text' | 'file'

export type KnowledgeDocumentPayload = {
  id?: string
  name?: string | null
  source?: string | null
  sourceType?: KnowledgeSourceType
  fileType?: string | null
  fileName?: string | null
  storagePath?: string | null
  summary?: string | null
  status?: 'draft' | 'ready' | 'indexed' | 'failed'
  content?: string | null
}

export type UploadedKnowledgeFile = {
  filename: string
  mimeType: string
  data: Buffer
}

export const KNOWLEDGE_BUCKET = 'knowledge-base'

export const normalizeOptionalText = (value: unknown) => {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export const buildStoragePath = (documentId: string, fileName: string) => {
  const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]+/g, '-')
  return `knowledge/${documentId}/${safeFileName}`
}

export const buildKnowledgeSummary = (content: string) => {
  const normalized = content.replace(/\s+/g, ' ').trim()
  return normalized ? normalized.slice(0, 240) : null
}

export const chunkKnowledgeContent = (content: string, chunkSize = 2000, overlap = 250) => {
  const normalized = content.replace(/\r\n/g, '\n').trim()

  if (!normalized) {
    return []
  }

  const chunks: string[] = []
  let start = 0

  while (start < normalized.length) {
    const end = Math.min(start + chunkSize, normalized.length)
    const chunk = normalized.slice(start, end).trim()

    if (chunk) {
      chunks.push(chunk)
    }

    if (end >= normalized.length) {
      break
    }

    start = Math.max(end - overlap, start + 1)
  }

  return chunks.map((chunk, index) => ({
    content: chunk,
    chunk_index: index,
  }))
}

export const ensureKnowledgeBucket = async (supabase: SupabaseClient) => {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()

  if (listError) {
    throw new Error(listError.message)
  }

  const exists = buckets?.some(bucket => bucket.name === KNOWLEDGE_BUCKET)
  if (exists) {
    return
  }

  const { error: createError } = await supabase.storage.createBucket(KNOWLEDGE_BUCKET, {
    public: false,
    fileSizeLimit: '25MB',
  })

  if (createError && !createError.message.toLowerCase().includes('already exists')) {
    throw new Error(createError.message)
  }
}

export const extractKnowledgeFileText = async (file: UploadedKnowledgeFile) => {
  const normalizedMimeType = file.mimeType.toLowerCase()
  const normalizedName = file.filename.toLowerCase()

  if (normalizedMimeType.includes('pdf') || normalizedName.endsWith('.pdf')) {
    const parser = new PDFParse({ data: file.data })
    const parsed = await parser.getText()
    const text = parsed.text.replace(/\s+\n/g, '\n').trim()

    await parser.destroy()

    if (!text) {
      throw new Error('The uploaded PDF did not contain extractable text.')
    }

    return {
      content: text,
      fileType: 'application/pdf',
    }
  }

  const text = file.data.toString('utf8').trim()

  if (!text) {
    throw new Error('The uploaded file did not contain readable text.')
  }

  return {
    content: text,
    fileType: file.mimeType || 'text/plain',
  }
}

export const uploadKnowledgeFile = async ({
  supabase,
  documentId,
  file,
}: {
  supabase: SupabaseClient
  documentId: string
  file: UploadedKnowledgeFile
}) => {
  await ensureKnowledgeBucket(supabase)

  const storagePath = buildStoragePath(documentId, file.filename)
  const { error } = await supabase.storage
    .from(KNOWLEDGE_BUCKET)
    .upload(storagePath, file.data, {
      contentType: file.mimeType || 'application/octet-stream',
      upsert: true,
    })

  if (error) {
    throw new Error(error.message)
  }

  return storagePath
}

export const removeKnowledgeFile = async ({
  supabase,
  storagePath,
}: {
  supabase: SupabaseClient
  storagePath?: string | null
}) => {
  if (!storagePath) {
    return
  }

  const { error } = await supabase.storage
    .from(KNOWLEDGE_BUCKET)
    .remove([storagePath])

  if (error && !error.message.toLowerCase().includes('not found')) {
    throw new Error(error.message)
  }
}

export const replaceDocumentChunks = async ({
  supabase,
  documentId,
  content,
  sourceType,
  fileName,
}: {
  supabase: SupabaseClient
  documentId: string
  content: string
  sourceType: KnowledgeSourceType
  fileName?: string | null
}) => {
  const { error: deleteError } = await supabase
    .from('document_chunks')
    .delete()
    .eq('document_id', documentId)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  const chunks = chunkKnowledgeContent(content)
  if (!chunks.length) {
    throw new Error('No chunkable content was produced for this source.')
  }

  const { error: insertError } = await supabase
    .from('document_chunks')
    .insert(chunks.map(chunk => ({
      document_id: documentId,
      content: chunk.content,
      chunk_index: chunk.chunk_index,
      metadata: {
        source: sourceType === 'file' ? 'upload' : 'manual',
        file_name: fileName ?? null,
        source_type: sourceType,
      },
    })))

  if (insertError) {
    throw new Error(insertError.message)
  }

  return chunks.length
}
