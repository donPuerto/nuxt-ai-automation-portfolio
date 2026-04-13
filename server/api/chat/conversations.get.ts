import { getSupabaseAdmin } from '../../utils/supabase-admin'
import { requireSupabaseUser } from '../../utils/knowledge-auth'

export default defineEventHandler(async (event) => {
  const user = await requireSupabaseUser(event)
  const supabase = getSupabaseAdmin(event)

  const { data, error } = await supabase
    .from('chats')
    .select('id,title,summary,agent_provider,agent_model,last_message_at,created_at,updated_at')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('last_message_at', { ascending: false })
    .limit(30)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return {
    chats: data ?? [],
  }
})
