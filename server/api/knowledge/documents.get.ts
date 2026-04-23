import { getSupabaseAdmin } from '../../utils/supabase-admin'
import { requireSupabaseUser } from '../../utils/knowledge-auth'

type KnowledgeDocumentRow = {
  id: string
  name: string
  source: string | null
  file_type: string | null
  source_type: 'text' | 'file'
  file_name: string | null
  storage_path: string | null
  summary: string | null
  status: 'draft' | 'ready' | 'indexed' | 'failed'
  created_at: string | null
  updated_at: string | null
}

type KnowledgeChunkRow = {
  id: string
  document_id: string | null
  content: string
  embedding?: unknown
  chunk_index: number | null
  metadata: Record<string, unknown> | null
  created_at: string | null
}

type EmbeddingStatus = 'indexed' | 'skipped' | 'failed' | 'unsupported'

const hasEmbeddingVector = (embedding: unknown) => {
  if (Array.isArray(embedding)) {
    return embedding.length > 0
  }

  if (typeof embedding === 'string') {
    const normalized = embedding.trim()
    return normalized.length > 0 && normalized !== 'null'
  }

  return false
}

const getEmbeddingStatus = (chunk: KnowledgeChunkRow): EmbeddingStatus => {
  if (hasEmbeddingVector(chunk.embedding)) {
    return 'indexed'
  }

  const metadata = chunk.metadata
  const rawStatus = typeof metadata?.embedding_status === 'string'
    ? metadata.embedding_status
    : ''

  if (rawStatus === 'indexed' || rawStatus === 'failed' || rawStatus === 'unsupported') {
    return rawStatus
  }

  return 'skipped'
}

export default defineEventHandler(async (event) => {
  await requireSupabaseUser(event)

  const supabase = getSupabaseAdmin(event)
  const [documentsResult, chunksResult] = await Promise.all([
    supabase
      .from('documents')
      .select('id,name,source,file_type,source_type,file_name,storage_path,summary,status,created_at,updated_at')
      .order('updated_at', { ascending: false }),
    supabase
      .from('document_chunks')
      .select('id,document_id,content,embedding,chunk_index,metadata,created_at')
      .order('chunk_index', { ascending: true })
      .limit(500),
  ])

  if (documentsResult.error) {
    throw createError({
      statusCode: 500,
      statusMessage: documentsResult.error.message,
    })
  }

  if (chunksResult.error) {
    throw createError({
      statusCode: 500,
      statusMessage: chunksResult.error.message,
    })
  }

  const chunks = (chunksResult.data ?? []) as KnowledgeChunkRow[]
  const chunkCountByDocument = new Map<string, number>()
  const embeddedChunkCountByDocument = new Map<string, number>()
  const failedEmbeddingCountByDocument = new Map<string, number>()
  const unsupportedEmbeddingCountByDocument = new Map<string, number>()
  const previewByDocument = new Map<string, string>()

  for (const chunk of chunks) {
    if (!chunk.document_id) {
      continue
    }

    chunkCountByDocument.set(chunk.document_id, (chunkCountByDocument.get(chunk.document_id) ?? 0) + 1)
    const embeddingStatus = getEmbeddingStatus(chunk)
    if (embeddingStatus === 'indexed') {
      embeddedChunkCountByDocument.set(chunk.document_id, (embeddedChunkCountByDocument.get(chunk.document_id) ?? 0) + 1)
    }
    else if (embeddingStatus === 'failed') {
      failedEmbeddingCountByDocument.set(chunk.document_id, (failedEmbeddingCountByDocument.get(chunk.document_id) ?? 0) + 1)
    }
    else if (embeddingStatus === 'unsupported') {
      unsupportedEmbeddingCountByDocument.set(chunk.document_id, (unsupportedEmbeddingCountByDocument.get(chunk.document_id) ?? 0) + 1)
    }

    if (!previewByDocument.has(chunk.document_id)) {
      previewByDocument.set(chunk.document_id, chunk.content)
    }
  }

  const documents = ((documentsResult.data ?? []) as KnowledgeDocumentRow[]).map(document => ({
    ...document,
    chunk_count: chunkCountByDocument.get(document.id) ?? 0,
    embedded_chunk_count: embeddedChunkCountByDocument.get(document.id) ?? 0,
    embedding_status: (() => {
      const totalChunkCount = chunkCountByDocument.get(document.id) ?? 0
      const embeddedChunkCount = embeddedChunkCountByDocument.get(document.id) ?? 0
      const failedEmbeddingCount = failedEmbeddingCountByDocument.get(document.id) ?? 0
      const unsupportedEmbeddingCount = unsupportedEmbeddingCountByDocument.get(document.id) ?? 0

      if (totalChunkCount === 0) {
        return 'skipped'
      }

      if (embeddedChunkCount === totalChunkCount) {
        return 'indexed'
      }

      if (failedEmbeddingCount > 0 && embeddedChunkCount === 0) {
        return 'failed'
      }

      if (unsupportedEmbeddingCount > 0 && embeddedChunkCount === 0) {
        return 'unsupported'
      }

      if (embeddedChunkCount > 0) {
        return 'partial'
      }

      return 'skipped'
    })(),
    preview: previewByDocument.get(document.id) ?? document.summary ?? '',
  }))

  const chunksWithEmbedding = chunks.map(chunk => ({
    ...chunk,
    embedding_status: getEmbeddingStatus(chunk),
    embedding_model: typeof chunk.metadata?.embedding_model === 'string'
      ? chunk.metadata.embedding_model
      : null,
    embedding_error: typeof chunk.metadata?.embedding_error === 'string'
      ? chunk.metadata.embedding_error
      : null,
  }))

  return {
    documents,
    chunks: chunksWithEmbedding,
  }
})
