import type { SupabaseClient } from '@supabase/supabase-js'

type KnowledgeSourceType = 'text' | 'file'
type EmbeddingStatus = 'indexed' | 'skipped' | 'failed' | 'unsupported'

type ReplaceDocumentChunksOptions = {
  openaiApiKey?: string | null
}

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
const KNOWLEDGE_EMBEDDING_MODEL = 'text-embedding-3-small'
const EMBEDDING_BATCH_SIZE = 16

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
    const { PDFParse } = await import('pdf-parse')
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
  options,
}: {
  supabase: SupabaseClient
  documentId: string
  content: string
  sourceType: KnowledgeSourceType
  fileName?: string | null
  options?: ReplaceDocumentChunksOptions
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

  const openaiApiKey = options?.openaiApiKey
    || process.env.OPENAI_API_KEY
    || process.env.NUXT_OPENAI_API_KEY

  let embeddingStatus: EmbeddingStatus = 'skipped'
  let embeddingError: string | null = null
  let embeddingModel: string | null = null
  let embeddingVectors: Array<string | null> = chunks.map(() => null)

  if (openaiApiKey) {
    try {
      const vectors = await generateChunkEmbeddings(chunks.map(chunk => chunk.content), openaiApiKey)
      embeddingVectors = vectors.map(toVectorLiteral)
      embeddingStatus = 'indexed'
      embeddingModel = KNOWLEDGE_EMBEDDING_MODEL
    }
    catch (error) {
      embeddingStatus = 'failed'
      embeddingError = error instanceof Error ? error.message : 'Embedding request failed.'
    }
  }

  const rowsWithEmbedding = chunks.map((chunk, index) => ({
    document_id: documentId,
    content: chunk.content,
    chunk_index: chunk.chunk_index,
    embedding: embeddingVectors[index],
    metadata: {
      source: sourceType === 'file' ? 'upload' : 'manual',
      file_name: fileName ?? null,
      source_type: sourceType,
      embedding_status: embeddingStatus,
      embedding_model: embeddingModel,
      embedding_error: embeddingError,
    },
  }))

  const { error: insertError } = await supabase
    .from('document_chunks')
    .insert(rowsWithEmbedding)

  if (insertError) {
    const lowered = insertError.message.toLowerCase()
    const shouldRetryWithoutEmbeddingColumn = lowered.includes("column 'embedding' does not exist")
      || lowered.includes('could not find the \'embedding\' column')

    if (!shouldRetryWithoutEmbeddingColumn) {
      throw new Error(insertError.message)
    }

    const rowsWithoutEmbedding = chunks.map(chunk => ({
      document_id: documentId,
      content: chunk.content,
      chunk_index: chunk.chunk_index,
      metadata: {
        source: sourceType === 'file' ? 'upload' : 'manual',
        file_name: fileName ?? null,
        source_type: sourceType,
        embedding_status: 'unsupported' as EmbeddingStatus,
        embedding_model: null,
        embedding_error: 'The embedding column is not available in document_chunks.',
      },
    }))

    const { error: retryError } = await supabase
      .from('document_chunks')
      .insert(rowsWithoutEmbedding)

    if (retryError) {
      throw new Error(retryError.message)
    }
  }

  return chunks.length
}

const toVectorLiteral = (values: number[]) => `[${values.join(',')}]`

const generateChunkEmbeddings = async (inputs: string[], apiKey: string) => {
  const vectors: Array<number[] | null> = inputs.map(() => null)

  for (let start = 0; start < inputs.length; start += EMBEDDING_BATCH_SIZE) {
    const batch = inputs.slice(start, start + EMBEDDING_BATCH_SIZE)
    const response = await $fetch<{
      data?: Array<{ index: number, embedding: number[] }>
    }>('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        model: KNOWLEDGE_EMBEDDING_MODEL,
        input: batch,
      },
    })

    const items = response.data ?? []
    if (items.length !== batch.length) {
      throw new Error('Embedding response did not return all chunk vectors.')
    }

    for (const item of items) {
      const targetIndex = start + item.index
      vectors[targetIndex] = item.embedding
    }
  }

  const missingVector = vectors.findIndex(vector => !Array.isArray(vector) || vector.length === 0)
  if (missingVector !== -1) {
    throw new Error('One or more chunk embeddings were missing from the provider response.')
  }

  return vectors as number[][]
}
