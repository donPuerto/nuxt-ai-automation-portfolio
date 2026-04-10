import { getSupabaseAdmin } from '../../../utils/supabase-admin'
import { requireSupabaseUser } from '../../../utils/knowledge-auth'

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

const normalizeOptionalText = (value: unknown) => {
  return typeof value === 'string' && value.trim() ? value.trim() : null
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

  const body = await readBody<KnowledgeDocumentBody>(event)
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
  const { data: document, error } = await supabase
    .from('documents')
    .update({
      name,
      source: normalizeOptionalText(body.source),
      source_type: sourceType,
      file_type: sourceType === 'file' ? (normalizeOptionalText(body.fileType) ?? 'pdf') : 'text',
      file_name: sourceType === 'file' ? normalizeOptionalText(body.fileName) : null,
      storage_path: sourceType === 'file' ? normalizeOptionalText(body.storagePath) : null,
      summary: normalizeOptionalText(body.summary),
      status: body.status ?? (sourceType === 'file' ? 'ready' : 'indexed'),
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

  if (sourceType === 'text' && content) {
    const { error: deleteError } = await supabase
      .from('document_chunks')
      .delete()
      .eq('document_id', id)

    if (deleteError) {
      throw createError({
        statusCode: 500,
        statusMessage: deleteError.message,
      })
    }

    const { error: insertError } = await supabase
      .from('document_chunks')
      .insert({
        document_id: id,
        content,
        chunk_index: 0,
        metadata: {
          source: 'manual',
        },
      })

    if (insertError) {
      throw createError({
        statusCode: 500,
        statusMessage: insertError.message,
      })
    }
  }

  return { document }
})
