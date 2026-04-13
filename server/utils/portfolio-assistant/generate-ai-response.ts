import type { PortfolioAssistantResponse } from './types'
import { aboutKnowledge } from '@@/shared'

type AiProvider = 'openrouter' | 'claude' | 'openai'

type GenerateAiResponseParams = {
  config: ReturnType<typeof useRuntimeConfig>
  prompt: string
  agentId?: string | null
}

type JsonResponseShape = {
  answer?: string
  sections?: PortfolioAssistantResponse['sections']
}

type ProviderAttempt = {
  provider: AiProvider
  model: string
}

const resolveOpenRouterKey = (config: ReturnType<typeof useRuntimeConfig>) =>
  config.openrouterApiKey
  || process.env.OPENROUTER_API_KEY
  || process.env.NUXT_OPENROUTER_API_KEY
  || ''

const resolveAnthropicKey = (config: ReturnType<typeof useRuntimeConfig>) =>
  config.anthropicApiKey
  || process.env.ANTHROPIC_API_KEY
  || process.env.NUXT_ANTHROPIC_API_KEY
  || ''

const resolveOpenAiKey = (config: ReturnType<typeof useRuntimeConfig>) =>
  config.openaiApiKey
  || process.env.OPENAI_API_KEY
  || process.env.NUXT_OPENAI_API_KEY
  || ''

const buildSystemPrompt = () => {
  const profileFacts = [
    `Role: ${aboutKnowledge.role}`,
    `Short bio: ${aboutKnowledge.shortBio}`,
    `Intro: ${aboutKnowledge.firstPersonIntro}`,
    `Background: ${aboutKnowledge.background.join(' ')}`,
    `What I do: ${aboutKnowledge.whatIDo.join(' ')}`,
    `Education: ${aboutKnowledge.education.join(' ')}`,
    `Work experience: ${aboutKnowledge.workExperience.join(' ')}`,
    `Trainings: ${aboutKnowledge.trainings.join(' ')}`,
    `Work style: ${aboutKnowledge.workStyle.join(' ')}`,
    `Differentiators: ${aboutKnowledge.differentiators.join(' ')}`,
    `Tech stack: ${aboutKnowledge.techStack.join(' ')}`,
    `Availability: ${aboutKnowledge.availability.join(' ')}`,
    `Contact: ${aboutKnowledge.contact.join(' ')}`,
  ].join('\n')

  return [
    'You are Don Puerto AI Assistant.',
    'Answer as a premium, helpful assistant representing Don Puerto.',
    'Use the profile facts below as first-class knowledge even if no RAG documents are available.',
    'For greetings, answer briefly and warmly. Do not overshare unless asked.',
    'If asked about background, school, education, resume, work experience, stack, or services, answer confidently from the profile facts below.',
    'Do not say knowledge is missing unless the user is explicitly asking about a document that is unavailable.',
    'Return valid JSON only with this shape: {"answer":"string","sections":[]}. Keep sections as an empty array unless you are very confident structured sections help.',
    '',
    'PROFILE FACTS',
    profileFacts,
  ].join('\n')
}

const parseJsonResponse = (content: string): PortfolioAssistantResponse => {
  try {
    const parsed = JSON.parse(content) as JsonResponseShape
    if (typeof parsed.answer === 'string') {
      return {
        answer: parsed.answer.trim(),
        sections: Array.isArray(parsed.sections) ? parsed.sections : [],
      }
    }
  }
  catch {
    // fall through to plain text response
  }

  return {
    answer: content.trim(),
    sections: [],
  }
}

const normalizePrompt = (prompt: string) => prompt.trim().toLowerCase()

const isGreetingPrompt = (prompt: string) => {
  const normalized = normalizePrompt(prompt)

  return [
    'hi',
    'hello',
    'hey',
    'good morning',
    'good afternoon',
    'good evening',
  ].includes(normalized)
}

const buildLocalFallbackResponse = (prompt: string): PortfolioAssistantResponse => {
  if (isGreetingPrompt(prompt)) {
    return {
      answer: `Hi, I'm Don Puerto's AI assistant. I can help you explore Don's background, automation work, projects, stack, and services.`,
      sections: [],
    }
  }

  return {
    answer: `I'm Don Puerto's AI assistant. I can help with Don's background, experience, projects, automation stack, services, and knowledge base content. Ask me something specific and I'll keep it focused.`,
    sections: [],
  }
}

const resolveProvider = (agentId?: string | null): { provider: AiProvider, model: string } => {
  const normalized = agentId?.trim() || ''

  if (normalized.startsWith('openrouter:')) {
    return {
      provider: 'openrouter',
      model: normalized.replace('openrouter:', ''),
    }
  }

  if (normalized.toLowerCase().includes('claude')) {
    return {
      provider: 'claude',
      model: normalized || 'claude-sonnet-4-5',
    }
  }

  if (normalized) {
    return {
      provider: 'openai',
      model: normalized,
    }
  }

  return {
    provider: 'openrouter',
    model: 'openai/gpt-4.1-mini',
  }
}

const buildProviderAttempts = (agentId: string | null | undefined, config: ReturnType<typeof useRuntimeConfig>): ProviderAttempt[] => {
  const preferred = resolveProvider(agentId)
  const hasOpenRouter = Boolean(resolveOpenRouterKey(config))
  const hasAnthropic = Boolean(resolveAnthropicKey(config))
  const hasOpenAi = Boolean(resolveOpenAiKey(config))
  const attempts: ProviderAttempt[] = []

  const pushAttempt = (attempt: ProviderAttempt) => {
    if (attempts.some(item => item.provider === attempt.provider && item.model === attempt.model)) {
      return
    }

    attempts.push(attempt)
  }

  pushAttempt(preferred)

  if (preferred.provider !== 'openrouter' && hasOpenRouter) {
    pushAttempt({ provider: 'openrouter', model: 'openai/gpt-4.1-mini' })
  }

  if (preferred.provider !== 'openai' && hasOpenAi) {
    pushAttempt({ provider: 'openai', model: 'gpt-4.1-mini' })
  }

  if (preferred.provider !== 'claude' && hasAnthropic) {
    pushAttempt({ provider: 'claude', model: 'claude-sonnet-4-5' })
  }

  return attempts.filter((attempt) => {
    if (attempt.provider === 'openrouter') {
      return hasOpenRouter
    }

    if (attempt.provider === 'openai') {
      return hasOpenAi
    }

    return hasAnthropic
  })
}

const callOpenRouter = async (config: ReturnType<typeof useRuntimeConfig>, model: string, prompt: string) => {
  const openrouterApiKey = resolveOpenRouterKey(config)
  if (!openrouterApiKey) {
    throw new Error('OpenRouter API key is not configured.')
  }

  const response = await $fetch<{
    choices?: Array<{ message?: { content?: string } }>
  }>('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openrouterApiKey}`,
      'Content-Type': 'application/json',
    },
    body: {
      model,
      messages: [
        {
          role: 'system',
          content: buildSystemPrompt(),
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.4,
      response_format: {
        type: 'json_object',
      },
    },
  })

  const content = response.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('OpenRouter returned an empty response.')
  }

  return parseJsonResponse(content)
}

const callAnthropic = async (config: ReturnType<typeof useRuntimeConfig>, model: string, prompt: string) => {
  const anthropicApiKey = resolveAnthropicKey(config)
  if (!anthropicApiKey) {
    throw new Error('Anthropic API key is not configured.')
  }

  const response = await $fetch<{
    content?: Array<{ type?: string, text?: string }>
  }>('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': anthropicApiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: {
      model,
      max_tokens: 900,
      temperature: 0.4,
      system: buildSystemPrompt(),
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    },
  })

  const content = response.content?.find(item => item.type === 'text')?.text
  if (!content) {
    throw new Error('Anthropic returned an empty response.')
  }

  return parseJsonResponse(content)
}

const callOpenAI = async (config: ReturnType<typeof useRuntimeConfig>, model: string, prompt: string) => {
  const openaiApiKey = resolveOpenAiKey(config)
  if (!openaiApiKey) {
    throw new Error('OpenAI API key is not configured.')
  }

  const response = await $fetch<{
    choices?: Array<{ message?: { content?: string } }>
  }>('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: {
      model,
      temperature: 0.4,
      response_format: {
        type: 'json_object',
      },
      messages: [
        {
          role: 'system',
          content: buildSystemPrompt(),
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    },
  })

  const content = response.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('OpenAI returned an empty response.')
  }

  return parseJsonResponse(content)
}

export const generatePortfolioAiResponse = async ({
  config,
  prompt,
  agentId,
}: GenerateAiResponseParams): Promise<PortfolioAssistantResponse> => {
  const attempts = buildProviderAttempts(agentId, config)
  let lastError: unknown = null

  for (const attempt of attempts) {
    try {
      if (attempt.provider === 'claude') {
        return await callAnthropic(config, attempt.model, prompt)
      }

      if (attempt.provider === 'openai') {
        return await callOpenAI(config, attempt.model, prompt)
      }

      return await callOpenRouter(config, attempt.model, prompt)
    }
    catch (error) {
      lastError = error
    }
  }

  if (lastError) {
    console.warn('all AI provider attempts failed, using local portfolio fallback', lastError)
  }

  return buildLocalFallbackResponse(prompt)
}
