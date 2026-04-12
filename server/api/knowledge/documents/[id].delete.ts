import { getSupabaseAdmin } from '../../../utils/supabase-admin'
import { requireSupabaseUser } from '../../../utils/knowledge-auth'
import { removeKnowledgeFile } from '../../../utils/knowledge-indexing'

export default defineEventHandler(async (event) => {
  await requireSupabaseUser(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Document id is required.',
    })
  }

  const supabase = getSupabaseAdmin(event)
  const { data: existingDocument, error: existingDocumentError } = await supabase
    .from('documents')
    .select('id,storage_path')
    .eq('id', id)
    .single()

  if (existingDocumentError || !existingDocument) {
    throw createError({
      statusCode: 404,
      statusMessage: existingDocumentError?.message || 'Knowledge source not found.',
    })
  }

  await removeKnowledgeFile({
    supabase,
    storagePath: existingDocument.storage_path,
  })

  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return { success: true }
})
