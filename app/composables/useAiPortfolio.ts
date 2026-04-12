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
import { useSessionStorage } from '@vueuse/core'
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

type SavedPromptApiRow = {
  id: string
  label: string
  prompt: string
  is_favorite?: boolean
  last_used_at?: string | null
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

const toSavedPromptHistoryEntry = (row: SavedPromptApiRow): AiPortfolioHistoryEntry => ({
  id: row.id,
  label: row.label || toPromptLabel(row.prompt),
  icon: 'lucide:message-square-text',
  prompt: row.prompt,
  intent: 'prompt',
  createdAt: row.created_at ?? row.last_used_at ?? null,
  updatedAt: row.updated_at ?? row.last_used_at ?? null,
  persisted: true,
})

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
  const historyEntries = useState<AiPortfolioHistoryEntry[]>('ai-portfolio-history', () => [])

  const hasResponse = computed(() => Boolean(response.value))

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

  const setHistoryEntries = (entries: AiPortfolioHistoryEntry[]) => {
    historyEntries.value = entries

    if (!isAuthenticated.value) {
      guestHistoryEntries.value = entries
    }
  }

  const addHistoryEntry = (entry: AiPortfolioHistoryEntry) => {
    const nextEntries = [
      entry,
      ...historyEntries.value.filter(item =>
        item.id !== entry.id
        && item.prompt !== entry.prompt
        && item.label !== entry.label,
      ),
    ].slice(0, 12)

    setHistoryEntries(nextEntries)
  }

  const buildHistoryEntry = (payload: PortfolioAssistantRequest): AiPortfolioHistoryEntry => {
    const trimmedPrompt = payload.prompt?.trim()

    return {
      id: `prompt-${Date.now()}`,
      label: toPromptLabel(trimmedPrompt),
      icon: 'lucide:message-square-text',
      prompt: trimmedPrompt,
      intent: 'prompt',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      persisted: false,
    }
  }

  const getAuthHeaders = async () => {
    if (!supabase) {
      throw new Error('Supabase is not configured.')
    }

    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token

    if (!token) {
      throw new Error('Please sign in to use saved prompts.')
    }

    return {
      Authorization: `Bearer ${token}`,
    }
  }

  const loadSavedPromptHistory = async () => {
    if (!isAuthenticated.value) {
      setHistoryEntries([...(guestHistoryEntries.value ?? [])])
      return
    }

    try {
      const headers = await getAuthHeaders()
      const result = await $fetch<{ prompts: SavedPromptApiRow[] }>('/api/chat/saved-prompts', {
        headers,
      })

      setHistoryEntries((result.prompts ?? []).map(toSavedPromptHistoryEntry))
    }
    catch (caughtError) {
      console.warn('failed to load saved prompts', caughtError)
    }
  }

  const savePromptHistory = async (entry: AiPortfolioHistoryEntry) => {
    if (!entry.prompt?.trim()) {
      return entry
    }

    if (!isAuthenticated.value) {
      addHistoryEntry({
        ...entry,
        persisted: false,
      })
      return entry
    }

    try {
      const headers = await getAuthHeaders()
      const result = await $fetch<{ prompt: SavedPromptApiRow }>('/api/chat/saved-prompts', {
        method: 'POST',
        headers,
        body: {
          label: entry.label,
          prompt: entry.prompt,
        },
      })

      const persistedEntry = toSavedPromptHistoryEntry(result.prompt)
      addHistoryEntry(persistedEntry)
      return persistedEntry
    }
    catch (caughtError) {
      console.warn('failed to save prompt history', caughtError)
      addHistoryEntry(entry)
      return entry
    }
  }

  const deleteHistoryEntry = async (entry: AiPortfolioHistoryEntry) => {
    if (isAuthenticated.value && entry.persisted) {
      try {
        const headers = await getAuthHeaders()
        await $fetch(`/api/chat/saved-prompts/${entry.id}`, {
          method: 'DELETE',
          headers,
        })
      }
      catch (caughtError) {
        console.warn('failed to delete saved prompt', caughtError)
        throw caughtError
      }
    }

    setHistoryEntries(historyEntries.value.filter(item => item.id !== entry.id))
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
        return
      }

      response.value = result.response
      expandedProjectSlug.value = null
      activePrompt.value = payload.intent === 'prompt' ? payload.prompt?.trim() || '' : ''
      activeIntent.value = payload.intent === 'me'
        || payload.intent === 'projects'
        || payload.intent === 'skills'
        || payload.intent === 'discovery-call'
        || payload.intent === 'prompt'
        ? payload.intent
        : ''
      await savePromptHistory(buildHistoryEntry(payload))
    }
    catch (caughtError) {
      console.error('ai portfolio request failed', caughtError)
      error.value = 'We could not load the portfolio response right now.'
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
    catch (error) {
      console.warn('failed to persist selected agent model', error)
    }
  }

  const submitPrompt = async (files: ChatFileWithStatus[] = []) => {
    const trimmedPrompt = prompt.value.trim()

    if (!trimmedPrompt) {
      return
    }

    await fetchResponse({
      prompt: trimmedPrompt,
      intent: 'prompt',
      attachments: toAttachments(files),
      agentId: selectedAgentId.value,
    })
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
    response.value = buildWorkspacePortfolioResponse({
      intent,
      prompt: navItem?.prompt,
    })
    error.value = ''
    loading.value = false
    activePrompt.value = ''
    activeIntent.value = intent
    expandedProjectSlug.value = null

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
  }

  const replayHistoryEntry = async (entry: AiPortfolioHistoryEntry) => {
    await fetchResponse({
      prompt: entry.prompt,
      intent: entry.intent ?? 'prompt',
    })
  }

  if (import.meta.client) {
    watch(isAuthenticated, () => {
      ensureSelectedAgentIsUsable()
      void loadSavedPromptHistory()
    })

    onMounted(async () => {
      if (settings && !settings.initialized.value) {
        await settings.loadSettings()
      }

      void loadOpenRouterFreeModels()
      applyStoredAgentPreference()
      await loadSavedPromptHistory()
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
