import type {
  AiPortfolioMarqueeItem,
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

  const runNavIntent = async (intent: AiPortfolioNavIntent) => {
    if (intent === 'discovery-call') {
      return
    }

    const navItem = aiPortfolioContent.navItems.find(item => item.id === intent)

    await fetchResponse({
      intent,
      prompt: navItem?.prompt,
    })
  }

  const runMarqueeIntent = async (item: AiPortfolioMarqueeItem) => {
    await fetchResponse({
      intent: 'category',
      categoryId: item.id,
      prompt: item.prompt,
    })
  }

  const toggleExpandedProject = (slug: string) => {
    expandedProjectSlug.value = expandedProjectSlug.value === slug ? null : slug
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
    runMarqueeIntent,
    toggleExpandedProject,
    getProjectBySlug,
  }
}
