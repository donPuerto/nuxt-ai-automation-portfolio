import { getSupabaseAdmin } from '../../../utils/supabase-admin'
import { requireSupabaseUser } from '../../../utils/knowledge-auth'

export default defineEventHandler(async (event) => {
  const user = await requireSupabaseUser(event)
  const supabase = getSupabaseAdmin(event)
  const promptId = getRouterParam(event, 'id')

  if (!promptId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Prompt id is required.',
    })
  }

  const { error } = await supabase
    .from('saved_prompts')
    .delete()
    .eq('id', promptId)
    .eq('user_id', user.id)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return {
    ok: true,
  }
})
