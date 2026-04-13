import type {
  AiPortfolioNavIntent,
  AiPortfolioPromptAgentOption,
  PortfolioAssistantAttachment,
  PortfolioAssistantRequest,
  PortfolioAssistantIntent,
  PortfolioAssistantResponse,
  PortfolioKnowledgeProject,
} from '@@/shared'
import type { ChatFileWithStatus } from '@/components/chat/chat-types'
import { useLocalStorage, useSessionStorage } from '@vueuse/core'
import { aiPortfolioContent, buildWorkspacePortfolioResponse, portfolioKnowledgeProjects } from '@@/shared'

type AssistantApiResult = {
  ok: boolean
  message: string
  response?: PortfolioAssistantResponse
}

type NavWebhookResult = {
  ok: boolean
  message: string
}

type ConversationApiRow = {
  id: string
  title: string | null
  summary?: string | null
  agent_provider?: 'openrouter' | 'claude' | 'openai'
  agent_model?: string | null
  last_message_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

type ConversationMessageApiRow = {
  id: string
  chat_id: string
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  content_format?: 'markdown' | 'text' | 'json'
  metadata?: Record<string, unknown>
  created_at?: string | null
  updated_at?: string | null
}

export interface AiPortfolioHistoryEntry {
  id: string
  label: string
  icon: string
  prompt?: string
  intent?: PortfolioAssistantIntent
  createdAt?: string | null
  updatedAt?: string | null
  persisted?: boolean
}

export interface AiPortfolioConversationTurn {
  id: string
  prompt: string
  response: PortfolioAssistantResponse | null
  error?: string
  createdAt?: string | null
  updatedAt?: string | null
}

const toPromptLabel = (prompt?: string) => {
  const trimmedPrompt = prompt?.trim() || ''

  if (!trimmedPrompt) {
    return 'New chat'
  }

  if (trimmedPrompt.length <= 72) {
    return trimmedPrompt
  }

  return `${trimmedPrompt.slice(0, 69).trimEnd()}...`
}

const isPersistedConversationId = (value?: string | null) => {
  if (!value) {
    return false
  }

  return !value.startsWith('prompt-')
    && !value.startsWith('nav-')
    && !value.startsWith('turn-')
}

const toConversationHistoryEntry = (row: ConversationApiRow): AiPortfolioHistoryEntry => ({
  id: row.id,
  label: row.title || 'New chat',
  icon: 'lucide:message-square-text',
  prompt: row.summary ?? row.title ?? '',
  intent: 'prompt',
  createdAt: row.created_at ?? row.last_message_at ?? null,
  updatedAt: row.updated_at ?? row.last_message_at ?? null,
  persisted: true,
})

const getResponseFromMetadata = (metadata: Record<string, unknown> | undefined, content: string): PortfolioAssistantResponse => {
  const sections = Array.isArray(metadata?.sections) ? metadata.sections as PortfolioAssistantResponse['sections'] : []

  return {
    answer: content,
    sections,
  }
}

const toConversationTurns = (messages: ConversationMessageApiRow[]): AiPortfolioConversationTurn[] => {
  const turns: AiPortfolioConversationTurn[] = []
  let pendingUserMessage: ConversationMessageApiRow | null = null

  for (const message of messages) {
    if (message.role === 'user') {
      pendingUserMessage = message
      continue
    }

    if (message.role === 'assistant' && pendingUserMessage) {
      turns.push({
        id: `${pendingUserMessage.id}:${message.id}`,
        prompt: pendingUserMessage.content,
        response: getResponseFromMetadata(message.metadata, message.content),
        createdAt: pendingUserMessage.created_at ?? message.created_at ?? null,
        updatedAt: message.updated_at ?? message.created_at ?? null,
      })
      pendingUserMessage = null
    }
  }

  if (pendingUserMessage) {
    turns.push({
      id: pendingUserMessage.id,
      prompt: pendingUserMessage.content,
      response: null,
      createdAt: pendingUserMessage.created_at ?? null,
      updatedAt: pendingUserMessage.updated_at ?? pendingUserMessage.created_at ?? null,
    })
  }

  return turns
}

export const useAiPortfolio = () => {
  const prompt = ref('')
  const loading = ref(false)
  const error = ref('')
  const response = ref<PortfolioAssistantResponse | null>(null)
  const expandedProjectSlug = ref<string | null>(null)
  const activePrompt = ref('')
  const activeIntent = ref<AiPortfolioNavIntent | 'prompt' | ''>('')
  const selectedAgentId = useState<string>('ai-portfolio-selected-agent', () => aiPortfolioContent.selectedPromptAgentId)
  const promptAgentOptions = useState('ai-portfolio-prompt-agent-options', () => aiPortfolioContent.promptAgentOptions)
  const settings = useSupabaseConfigured() ? useUserSettings() : null
  const supabase = useSupabaseConfigured() ? useSupabaseClient() : null
  const isAuthenticated = computed(() => Boolean(settings?.isAuthenticated.value))
  const guestHistoryEntries = useSessionStorage<AiPortfolioHistoryEntry[]>('ai-portfolio-guest-history', [])
  const guestConversationTurns = useSessionStorage<AiPortfolioConversationTurn[]>('ai-portfolio-guest-conversation', [])
  const guestChatId = useSessionStorage<string | null>('ai-portfolio-guest-chat-id', null)
  const persistedHistoryEntries = useLocalStorage<AiPortfolioHistoryEntry[]>('ai-portfolio-history-cache', [])
  const persistedConversationTurns = useLocalStorage<AiPortfolioConversationTurn[]>('ai-portfolio-conversation-cache', [])
  const persistedChatId = useLocalStorage<string | null>('ai-portfolio-current-chat-cache', null)
  const persistedCurrentChatId = useSessionStorage<string | null>('ai-portfolio-current-chat', null)
  const historyEntries = useState<AiPortfolioHistoryEntry[]>('ai-portfolio-history', () => [])
  const conversationTurns = useState<AiPortfolioConversationTurn[]>('ai-portfolio-conversation-turns', () => [])
  const currentChatId = useState<string | null>('ai-portfolio-current-chat-id', () => null)

  const hasResponse = computed(() =>
    conversationTurns.value.some(turn => Boolean(turn.response || turn.error))
    || Boolean(response.value),
  )

  const projectMap = computed(() => {
    return new Map(portfolioKnowledgeProjects.map(project => [project.slug, project]))
  })

  const getProjectBySlug = (slug: string): PortfolioKnowledgeProject | undefined => {
    return projectMap.value.get(slug)
  }

  const isAgentSelectable = (option: AiPortfolioPromptAgentOption) => {
    return option.available && (!option.requiresAuth || isAuthenticated.value)
  }

  const ensureSelectedAgentIsUsable = () => {
    const selected = promptAgentOptions.value.find(item => item.id === selectedAgentId.value)
    if (selected && isAgentSelectable(selected)) {
      return
    }

    const firstUsable = promptAgentOptions.value.find(isAgentSelectable)
    if (firstUsable) {
      selectedAgentId.value = firstUsable.id
    }
  }

  const setConversationTurns = (turns: AiPortfolioConversationTurn[]) => {
    conversationTurns.value = turns
    persistedConversationTurns.value = turns

    if (!isAuthenticated.value) {
      guestConversationTurns.value = turns
    }
  }

  const setChatId = (chatId: string | null) => {
    currentChatId.value = chatId
    persistedCurrentChatId.value = chatId
    persistedChatId.value = chatId

    if (!isAuthenticated.value) {
      guestChatId.value = chatId
    }
  }

  const setHistoryEntries = (entries: AiPortfolioHistoryEntry[]) => {
    historyEntries.value = entries
    persistedHistoryEntries.value = entries

    if (!isAuthenticated.value) {
      guestHistoryEntries.value = entries
    }
  }

  const addHistoryEntry = (entry: AiPortfolioHistoryEntry) => {
    const nextEntries = [
      entry,
      ...historyEntries.value.filter(item => item.id !== entry.id),
    ].slice(0, 30)

    setHistoryEntries(nextEntries)
  }

  const isPersistedConversationEntry = (entry: AiPortfolioHistoryEntry) =>
    Boolean(isAuthenticated.value && entry.persisted && isPersistedConversationId(entry.id))

  const getAuthHeaders = async () => {
    if (!supabase) {
      throw new Error('Supabase is not configured.')
    }

    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token

    if (!token) {
      throw new Error('Please sign in to use saved conversations.')
    }

    return {
      Authorization: `Bearer ${token}`,
    }
  }

  const loadConversationHistory = async () => {
    if (!isAuthenticated.value) {
      const fallbackHistory = guestHistoryEntries.value?.length
        ? guestHistoryEntries.value
        : (persistedHistoryEntries.value ?? [])
      const fallbackTurns = guestConversationTurns.value?.length
        ? guestConversationTurns.value
        : (persistedConversationTurns.value ?? [])
      const fallbackChatId = isPersistedConversationId(guestChatId.value)
        ? guestChatId.value
        : (isPersistedConversationId(persistedChatId.value) ? persistedChatId.value : null)

      setHistoryEntries([...(fallbackHistory ?? [])])
      setConversationTurns([...(fallbackTurns ?? [])])
      setChatId(fallbackChatId)
      return
    }

    try {
      const headers = await getAuthHeaders()
      const result = await $fetch<{ chats: ConversationApiRow[] }>('/api/chat/conversations', {
        headers,
      })

      const chats = result.chats ?? []
      setHistoryEntries(chats.map(toConversationHistoryEntry))

      const cachedChatId = persistedCurrentChatId.value
      if (cachedChatId
        && isPersistedConversationId(cachedChatId)
        && chats.some(chat => chat.id === cachedChatId)) {
        await loadConversation(cachedChatId)
      }
    }
    catch (caughtError) {
      console.warn('failed to load conversations', caughtError)
      if (persistedHistoryEntries.value?.length) {
        setHistoryEntries([...(persistedHistoryEntries.value ?? [])])
      }
      if (persistedConversationTurns.value?.length) {
        setConversationTurns([...(persistedConversationTurns.value ?? [])])
      }
      if (!currentChatId.value && isPersistedConversationId(persistedChatId.value)) {
        setChatId(persistedChatId.value)
      }
    }
  }

  const loadConversation = async (chatId: string) => {
    const headers = await getAuthHeaders()
    const result = await $fetch<{ chat: ConversationApiRow, messages: ConversationMessageApiRow[] }>(`/api/chat/conversations/${chatId}`, {
      headers,
    })

    setChatId(result.chat.id)
    const turns = toConversationTurns(result.messages ?? [])
    setConversationTurns(turns)

    const latestTurn = turns.at(-1)
    response.value = latestTurn?.response ?? null
    activePrompt.value = latestTurn?.prompt ?? ''
    activeIntent.value = 'prompt'
    error.value = latestTurn?.error ?? ''
    expandedProjectSlug.value = null
  }

  const saveConversationTurn = async (payload: PortfolioAssistantRequest, resolvedResponse: PortfolioAssistantResponse) => {
    const trimmedPrompt = payload.prompt?.trim()

    if (!trimmedPrompt) {
      return
    }

    const turn: AiPortfolioConversationTurn = {
      id: `turn-${Date.now()}`,
      prompt: trimmedPrompt,
      response: resolvedResponse,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setConversationTurns([...conversationTurns.value, turn])

    const historyEntry: AiPortfolioHistoryEntry = {
      id: currentChatId.value ?? `prompt-${Date.now()}`,
      label: toPromptLabel(trimmedPrompt),
      icon: 'lucide:message-square-text',
      prompt: trimmedPrompt,
      intent: 'prompt',
      createdAt: turn.createdAt,
      updatedAt: turn.updatedAt,
      persisted: isAuthenticated.value,
    }

    if (!isAuthenticated.value) {
      addHistoryEntry(historyEntry)
      return
    }

    try {
      const headers = await getAuthHeaders()
      const selectedAgent = promptAgentOptions.value.find(item => item.id === selectedAgentId.value)
      const result = await $fetch<{ chat: ConversationApiRow, messages: ConversationMessageApiRow[] }>('/api/chat/conversations', {
        method: 'POST',
        headers,
        body: {
          chatId: currentChatId.value,
          title: toPromptLabel(trimmedPrompt),
          summary: trimmedPrompt,
          agentProvider: selectedAgent?.provider ?? 'openrouter',
          agentModel: selectedAgent?.id ?? selectedAgentId.value,
          messages: [
            {
              role: 'user',
              content: trimmedPrompt,
              metadata: {
                intent: payload.intent ?? 'prompt',
                attachments: payload.attachments ?? [],
                agentId: payload.agentId ?? selectedAgentId.value,
              },
            },
            {
              role: 'assistant',
              content: resolvedResponse.answer,
              metadata: {
                sections: resolvedResponse.sections,
              },
            },
          ],
        },
      })

      setChatId(result.chat.id)
      addHistoryEntry(toConversationHistoryEntry(result.chat))
    }
    catch (caughtError) {
      console.warn('failed to save conversation turn', caughtError)
      addHistoryEntry(historyEntry)
    }
  }

  const deleteHistoryEntry = async (entry: AiPortfolioHistoryEntry) => {
    if (isPersistedConversationEntry(entry)) {
      try {
        const headers = await getAuthHeaders()
        await $fetch(`/api/chat/conversations/${entry.id}`, {
          method: 'DELETE',
          headers,
        })
      }
      catch (caughtError) {
        console.warn('failed to delete saved conversation', caughtError)
        throw caughtError
      }
    }

    setHistoryEntries(historyEntries.value.filter(item => item.id !== entry.id))

    if (currentChatId.value === entry.id) {
      setChatId(null)
      setConversationTurns([])
      response.value = null
      activePrompt.value = ''
      error.value = ''
    }
  }

  const toAttachments = (files: ChatFileWithStatus[]): PortfolioAssistantAttachment[] => files.map(file => ({
    id: file.id,
    name: file.file.name,
    mimeType: file.file.type,
    size: file.file.size,
  }))

  const fetchResponse = async (payload: PortfolioAssistantRequest) => {
    loading.value = true
    error.value = ''

    try {
      const result = await $fetch<AssistantApiResult>('/api/portfolio-assistant/respond', {
        method: 'POST',
        body: payload,
      })

      if (!result.ok || !result.response) {
        error.value = result.message || 'We could not load the portfolio response right now.'
        return false
      }

      response.value = result.response
      expandedProjectSlug.value = null
      activePrompt.value = payload.intent === 'prompt' ? payload.prompt?.trim() || '' : ''
      activeIntent.value = payload.intent === 'me'
        || payload.intent === 'projects'
        || payload.intent === 'skills'
        || payload.intent === 'discovery-call'
        || payload.intent === 'settings'
        || payload.intent === 'prompt'
        ? payload.intent
        : ''
      await saveConversationTurn(payload, result.response)
      return true
    }
    catch (caughtError) {
      console.error('ai portfolio request failed', caughtError)
      error.value = 'We could not load the portfolio response right now.'
      return false
    }
    finally {
      loading.value = false
    }
  }

  const resolveAgentIdFromPreference = (
    provider: 'openrouter' | 'claude' | 'openai',
    model: string,
    options: AiPortfolioPromptAgentOption[],
  ) => {
    if (provider === 'openrouter') {
      const exact = options.find(item =>
        item.provider === 'openrouter'
        && (item.id === model || item.id === `openrouter:${model}`),
      )

      if (exact && isAgentSelectable(exact)) {
        return exact.id
      }

      return options.find(item => item.provider === 'openrouter' && isAgentSelectable(item))?.id
    }

    const direct = options.find(item => item.provider === provider && item.id === model && isAgentSelectable(item))
    if (direct) {
      return direct.id
    }

    return options.find(item => item.provider === provider && isAgentSelectable(item))?.id
  }

  const applyStoredAgentPreference = () => {
    if (!settings || !settings.isAuthenticated.value) {
      return
    }

    const preferredId = resolveAgentIdFromPreference(
      settings.preferences.value.agentProvider,
      settings.preferences.value.agentModel,
      promptAgentOptions.value,
    )

    if (preferredId) {
      selectedAgentId.value = preferredId
      return
    }

    const firstAvailable = promptAgentOptions.value.find(isAgentSelectable)
    if (firstAvailable) {
      selectedAgentId.value = firstAvailable.id
    }
  }

  const loadOpenRouterFreeModels = async () => {
    const fallbackOptions = aiPortfolioContent.promptAgentOptions

    try {
      const [openrouterResult, claudeResult, openaiResult] = await Promise.all([
        $fetch<{ ok: boolean, models: typeof aiPortfolioContent.promptAgentOptions }>(
          '/api/models/available?provider=openrouter&freeOnly=true&autoSync=true',
        ),
        $fetch<{ ok: boolean, models: typeof aiPortfolioContent.promptAgentOptions }>(
          '/api/models/available?provider=claude&autoSync=true',
        ),
        $fetch<{ ok: boolean, models: typeof aiPortfolioContent.promptAgentOptions }>(
          '/api/models/available?provider=openai&autoSync=true',
        ),
      ])

      const pickProvider = (
        result: { ok: boolean, models: typeof aiPortfolioContent.promptAgentOptions },
        provider: 'openrouter' | 'claude' | 'openai',
      ) => (result.ok ? result.models.filter(model => model.provider === provider) : [])

      const merged = [
        ...pickProvider(openrouterResult, 'openrouter'),
        ...pickProvider(claudeResult, 'claude'),
        ...pickProvider(openaiResult, 'openai'),
      ]

      const deduped = Array.from(new Map(merged.map(model => [model.id, model])).values())

      if (!deduped.length) {
        promptAgentOptions.value = [...fallbackOptions]
        return
      }

      promptAgentOptions.value = deduped
    }
    catch {
      promptAgentOptions.value = [...fallbackOptions]
    }

    ensureSelectedAgentIsUsable()
    applyStoredAgentPreference()
    ensureSelectedAgentIsUsable()
  }

  const selectAgent = async (agentId: string) => {
    const option = promptAgentOptions.value.find(item => item.id === agentId)

    if (!option || !isAgentSelectable(option)) {
      return
    }

    selectedAgentId.value = agentId

    if (!settings || !settings.isAuthenticated.value) {
      return
    }

    const normalizedProvider = option.provider ?? 'openrouter'
    const normalizedModel = option.id.startsWith('openrouter:')
      ? option.id.replace('openrouter:', '')
      : option.id

    settings.preferences.value.agentProvider = normalizedProvider
    settings.preferences.value.agentModel = normalizedModel

    try {
      await settings.saveAppearance()
    }
    catch (caughtError) {
      console.warn('failed to persist selected agent model', caughtError)
    }
  }

  const submitPrompt = async (files: ChatFileWithStatus[] = []) => {
    const trimmedPrompt = prompt.value.trim()

    if (!trimmedPrompt) {
      return
    }

    const success = await fetchResponse({
      prompt: trimmedPrompt,
      intent: 'prompt',
      attachments: toAttachments(files),
      agentId: selectedAgentId.value,
    })

    if (success) {
      prompt.value = ''
    }
  }

  const triggerNavWebhook = async (intent: AiPortfolioNavIntent) => {
    const navItem = aiPortfolioContent.navItems.find(item => item.id === intent)

    if (!navItem) {
      return
    }

    try {
      const result = await $fetch<NavWebhookResult>('/api/portfolio-assistant/me-webhook', {
        method: 'POST',
        body: {
          intent,
          label: navItem.label,
          prompt: navItem.prompt,
          path: import.meta.client ? window.location.pathname : '/',
        },
      })

      if (!result.ok) {
        console.warn('portfolio nav webhook unavailable', result.message)
      }
    }
    catch (caughtError) {
      console.warn('portfolio nav webhook skipped', caughtError)
    }
  }

  const runNavIntent = async (intent: AiPortfolioNavIntent) => {
    const navItem = aiPortfolioContent.navItems.find(item => item.id === intent)
    const builtResponse = buildWorkspacePortfolioResponse({
      intent,
      prompt: navItem?.prompt,
    })

    response.value = builtResponse
    error.value = ''
    loading.value = false
    activePrompt.value = ''
    activeIntent.value = intent
    expandedProjectSlug.value = null
    setConversationTurns([
      {
        id: `nav-${intent}`,
        prompt: navItem?.prompt ?? '',
        response: builtResponse,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ])

    if (intent === 'me') {
      await triggerNavWebhook(intent)
    }
  }

  const toggleExpandedProject = (slug: string) => {
    expandedProjectSlug.value = expandedProjectSlug.value === slug ? null : slug

    if (import.meta.client && expandedProjectSlug.value) {
      nextTick(() => {
        const target = document.getElementById(`expanded-project-${expandedProjectSlug.value}`)
        target?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      })
    }
  }

  const resetConversation = () => {
    prompt.value = ''
    error.value = ''
    response.value = null
    activePrompt.value = ''
    activeIntent.value = ''
    expandedProjectSlug.value = null
    setChatId(null)
    setConversationTurns([])
  }

  const replayHistoryEntry = async (entry: AiPortfolioHistoryEntry) => {
    if (isPersistedConversationEntry(entry)) {
      await loadConversation(entry.id)
      return
    }

    if (entry.prompt) {
      prompt.value = entry.prompt
    }
  }

  if (import.meta.client) {
    watch(isAuthenticated, () => {
      ensureSelectedAgentIsUsable()
      void loadConversationHistory()
    })

    onMounted(async () => {
      if (settings && !settings.initialized.value) {
        await settings.loadSettings()
      }

      void loadOpenRouterFreeModels()
      applyStoredAgentPreference()
      await loadConversationHistory()
    })
  }

  return {
    prompt,
    loading,
    error,
    response,
    hasResponse,
    activePrompt,
    activeIntent,
    expandedProjectSlug,
    selectedAgentId,
    promptAgentOptions,
    isAuthenticated,
    historyEntries,
    conversationTurns,
    currentChatId,
    deleteHistoryEntry,
    submitPrompt,
    runNavIntent,
    toggleExpandedProject,
    getProjectBySlug,
    selectAgent,
    loadOpenRouterFreeModels,
    resetConversation,
    replayHistoryEntry,
  }
}
