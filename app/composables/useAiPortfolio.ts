import type {
  AiPortfolioNavIntent,
  AiPortfolioPromptAgentOption,
  AiPortfolioSidebarSeed,
  PortfolioAssistantAttachment,
  PortfolioAssistantRequest,
  PortfolioAssistantIntent,
  PortfolioAssistantResponse,
  PortfolioKnowledgeProject,
} from '@@/shared'
import type { ChatFileWithStatus } from '@/components/chat/chat-types'
import { aiPortfolioContent, portfolioKnowledgeProjects } from '@@/shared'

type AssistantApiResult = {
  ok: boolean
  message: string
  response?: PortfolioAssistantResponse
}

type NavWebhookResult = {
  ok: boolean
  message: string
}

export interface AiPortfolioHistoryEntry {
  id: string
  label: string
  icon: string
  prompt?: string
  intent?: PortfolioAssistantIntent
}

const toHistoryEntry = (item: AiPortfolioSidebarSeed): AiPortfolioHistoryEntry => ({
  id: item.id,
  label: item.label,
  icon: item.icon,
  prompt: item.prompt,
  intent: item.intent,
})

export const useAiPortfolio = () => {
  const prompt = ref('')
  const loading = ref(false)
  const error = ref('')
  const response = ref<PortfolioAssistantResponse | null>(null)
  const expandedProjectSlug = ref<string | null>(null)
  const activePrompt = ref('')
  const selectedAgentId = useState<string>('ai-portfolio-selected-agent', () => aiPortfolioContent.selectedPromptAgentId)
  const promptAgentOptions = useState('ai-portfolio-prompt-agent-options', () => aiPortfolioContent.promptAgentOptions)
  const settings = useSupabaseConfigured() ? useUserSettings() : null
  const isAuthenticated = computed(() => Boolean(settings?.isAuthenticated.value))
  const historyEntries = useState<AiPortfolioHistoryEntry[]>('ai-portfolio-history', () =>
    aiPortfolioContent.sidebarSeedItems.map(toHistoryEntry),
  )

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

  const addHistoryEntry = (entry: AiPortfolioHistoryEntry) => {
    historyEntries.value = [
      entry,
      ...historyEntries.value.filter(item => item.label !== entry.label),
    ].slice(0, 8)
  }

  const buildHistoryEntry = (payload: PortfolioAssistantRequest): AiPortfolioHistoryEntry => {
    const trimmedPrompt = payload.prompt?.trim()

    if (payload.intent && payload.intent !== 'prompt') {
      const navItem = aiPortfolioContent.navItems.find(item => item.id === payload.intent)

      if (navItem) {
        return {
          id: `${payload.intent}-${Date.now()}`,
          label: navItem.label,
          icon: navItem.icon,
          prompt: navItem.prompt,
          intent: payload.intent,
        }
      }
    }

    return {
      id: `prompt-${Date.now()}`,
      label: trimmedPrompt || 'New chat',
      icon: 'lucide:message-square-text',
      prompt: trimmedPrompt,
      intent: payload.intent ?? 'prompt',
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
        return
      }

      response.value = result.response
      expandedProjectSlug.value = null
      activePrompt.value = payload.prompt?.trim() || ''
      addHistoryEntry(buildHistoryEntry(payload))
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
    if (intent === 'me') {
      await triggerNavWebhook(intent)
    }

    const navItem = aiPortfolioContent.navItems.find(item => item.id === intent)

    await fetchResponse({
      intent,
      prompt: navItem?.prompt,
    })
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
    })

    onMounted(async () => {
      if (settings && !settings.initialized.value) {
        await settings.loadSettings()
      }

      void loadOpenRouterFreeModels()
      applyStoredAgentPreference()
    })
  }

  return {
    prompt,
    loading,
    error,
    response,
    hasResponse,
    activePrompt,
    expandedProjectSlug,
    selectedAgentId,
    promptAgentOptions,
    isAuthenticated,
    historyEntries,
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
