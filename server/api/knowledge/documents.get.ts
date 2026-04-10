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
  chunk_index: number | null
  metadata: Record<string, unknown> | null
  created_at: string | null
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
      .select('id,document_id,content,chunk_index,metadata,created_at')
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
  const previewByDocument = new Map<string, string>()

  for (const chunk of chunks) {
    if (!chunk.document_id) {
      continue
    }

    chunkCountByDocument.set(chunk.document_id, (chunkCountByDocument.get(chunk.document_id) ?? 0) + 1)
    if (!previewByDocument.has(chunk.document_id)) {
      previewByDocument.set(chunk.document_id, chunk.content)
    }
  }

  const documents = ((documentsResult.data ?? []) as KnowledgeDocumentRow[]).map(document => ({
    ...document,
    chunk_count: chunkCountByDocument.get(document.id) ?? 0,
    preview: previewByDocument.get(document.id) ?? document.summary ?? '',
  }))

  return {
    documents,
    chunks,
  }
})
