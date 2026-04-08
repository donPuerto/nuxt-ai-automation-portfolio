import type {
  AiPortfolioNavIntent,
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

  const selectAgent = (agentId: string) => {
    const option = aiPortfolioContent.promptAgentOptions.find(item => item.id === agentId)

    if (!option?.available) {
      return
    }

    selectedAgentId.value = agentId
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

  return {
    prompt,
    loading,
    error,
    response,
    hasResponse,
    activePrompt,
    expandedProjectSlug,
    selectedAgentId,
    historyEntries,
    submitPrompt,
    runNavIntent,
    toggleExpandedProject,
    getProjectBySlug,
    selectAgent,
    resetConversation,
    replayHistoryEntry,
  }
}
