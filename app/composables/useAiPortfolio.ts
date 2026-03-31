import type {
  AiPortfolioNavIntent,
  PortfolioAssistantRequest,
  PortfolioAssistantResponse,
  PortfolioKnowledgeProject,
} from '@@/shared'
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

export const useAiPortfolio = () => {
  const prompt = ref('')
  const loading = ref(false)
  const error = ref('')
  const response = ref<PortfolioAssistantResponse | null>(null)
  const expandedProjectSlug = ref<string | null>(null)
  const activePrompt = ref('')

  const hasResponse = computed(() => Boolean(response.value))

  const projectMap = computed(() => {
    return new Map(portfolioKnowledgeProjects.map(project => [project.slug, project]))
  })

  const getProjectBySlug = (slug: string): PortfolioKnowledgeProject | undefined => {
    return projectMap.value.get(slug)
  }

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
    }
    catch (caughtError) {
      console.error('ai portfolio request failed', caughtError)
      error.value = 'We could not load the portfolio response right now.'
    }
    finally {
      loading.value = false
    }
  }

  const submitPrompt = async () => {
    const trimmedPrompt = prompt.value.trim()

    if (!trimmedPrompt) {
      return
    }

    await fetchResponse({
      prompt: trimmedPrompt,
      intent: 'prompt',
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

  return {
    prompt,
    loading,
    error,
    response,
    hasResponse,
    activePrompt,
    expandedProjectSlug,
    submitPrompt,
    runNavIntent,
    toggleExpandedProject,
    getProjectBySlug,
  }
}
