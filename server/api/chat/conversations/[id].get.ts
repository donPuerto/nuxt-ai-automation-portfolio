import { getSupabaseAdmin } from '../../../utils/supabase-admin'
import { requireSupabaseUser } from '../../../utils/knowledge-auth'

export default defineEventHandler(async (event) => {
  const user = await requireSupabaseUser(event)
  const supabase = getSupabaseAdmin(event)
  const chatId = getRouterParam(event, 'id')

  if (!chatId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Chat id is required.',
    })
  }

  const [{ data: chat, error: chatError }, { data: messages, error: messagesError }] = await Promise.all([
    supabase
      .from('chats')
      .select('id,title,summary,agent_provider,agent_model,last_message_at,created_at,updated_at')
      .eq('id', chatId)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('messages')
      .select('id,chat_id,role,content,content_format,metadata,created_at,updated_at')
      .eq('chat_id', chatId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),
  ])

  if (chatError || !chat) {
    throw createError({
      statusCode: chatError?.code === 'PGRST116' ? 404 : 500,
      statusMessage: chatError?.message ?? 'Chat not found.',
    })
  }

  if (messagesError) {
    throw createError({
      statusCode: 500,
      statusMessage: messagesError.message,
    })
  }

  return {
    chat,
    messages: messages ?? [],
  }
})
