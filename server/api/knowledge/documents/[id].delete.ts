import { getSupabaseAdmin } from '../../../utils/supabase-admin'
import { requireSupabaseUser } from '../../../utils/knowledge-auth'

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
