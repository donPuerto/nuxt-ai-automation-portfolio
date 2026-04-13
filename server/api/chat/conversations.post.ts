import { getSupabaseAdmin } from '../../utils/supabase-admin'
import { requireSupabaseUser } from '../../utils/knowledge-auth'

type ConversationMessageBody = {
  role: 'user' | 'assistant'
  content: string
  metadata?: Record<string, unknown>
}

type ConversationBody = {
  chatId?: string | null
  title?: string | null
  summary?: string | null
  agentProvider?: 'openrouter' | 'claude' | 'openai'
  agentModel?: string | null
  messages?: ConversationMessageBody[]
}

const normalizeText = (value: unknown) => typeof value === 'string' ? value.trim() : ''

const buildTitle = (title: string, fallbackPrompt: string) => {
  const base = title || fallbackPrompt || 'New chat'

  if (base.length <= 120) {
    return base
  }

  return `${base.slice(0, 117).trimEnd()}...`
}

export default defineEventHandler(async (event) => {
  const user = await requireSupabaseUser(event)
  const supabase = getSupabaseAdmin(event)
  const body = (await readBody<ConversationBody>(event)) ?? {}

  const incomingMessages = (body.messages ?? [])
    .map(message => ({
      role: message.role,
      content: normalizeText(message.content),
      metadata: message.metadata ?? {},
    }))
    .filter(message => message.content)

  if (!incomingMessages.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'At least one message is required.',
    })
  }

  let chatId = normalizeText(body.chatId)
  const firstUserPrompt = incomingMessages.find(message => message.role === 'user')?.content ?? ''
  const title = buildTitle(normalizeText(body.title), firstUserPrompt)
  const summary = normalizeText(body.summary)
  const agentProvider = body.agentProvider ?? 'openrouter'
  const agentModel = normalizeText(body.agentModel) || 'openrouter-free'

  if (!chatId) {
    const { data: insertedChat, error: insertChatError } = await supabase
      .from('chats')
      .insert({
        user_id: user.id,
        title,
        summary: summary || null,
        agent_provider: agentProvider,
        agent_model: agentModel,
      })
      .select('id,title,summary,agent_provider,agent_model,last_message_at,created_at,updated_at')
      .single()

    if (insertChatError || !insertedChat) {
      throw createError({
        statusCode: 500,
        statusMessage: insertChatError?.message ?? 'Unable to create chat.',
      })
    }

    chatId = insertedChat.id
  }
  else {
    const { error: updateChatError } = await supabase
      .from('chats')
      .update({
        title,
        summary: summary || null,
        agent_provider: agentProvider,
        agent_model: agentModel,
      })
      .eq('id', chatId)
      .eq('user_id', user.id)

    if (updateChatError) {
      throw createError({
        statusCode: 500,
        statusMessage: updateChatError.message,
      })
    }
  }

  const rows = incomingMessages.map(message => ({
    chat_id: chatId,
    user_id: user.id,
    role: message.role,
    content: message.content,
    content_format: 'markdown',
    metadata: message.metadata,
  }))

  const { data: insertedMessages, error: insertMessagesError } = await supabase
    .from('messages')
    .insert(rows)
    .select('id,chat_id,role,content,content_format,metadata,created_at,updated_at')

  if (insertMessagesError) {
    throw createError({
      statusCode: 500,
      statusMessage: insertMessagesError.message,
    })
  }

  const { data: chat, error: chatError } = await supabase
    .from('chats')
    .select('id,title,summary,agent_provider,agent_model,last_message_at,created_at,updated_at')
    .eq('id', chatId)
    .eq('user_id', user.id)
    .single()

  if (chatError || !chat) {
    throw createError({
      statusCode: 500,
      statusMessage: chatError?.message ?? 'Unable to load chat.',
    })
  }

  return {
    chat,
    messages: insertedMessages ?? [],
  }
})
