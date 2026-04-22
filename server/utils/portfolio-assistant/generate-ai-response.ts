import type { PortfolioAssistantResponse } from './types'
import { aboutKnowledge } from '@@/shared'
import { normalizeAssistantText } from './response-format'

type AiProvider = 'openrouter' | 'claude' | 'openai'

type GenerateAiResponseParams = {
  config: ReturnType<typeof useRuntimeConfig>
  prompt: string
  agentId?: string | null
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
    'Use only the profile facts below as your source of truth.',
    'Do not use outside facts, assumptions, or general model memory.',
    'For greetings, answer briefly and warmly. Do not overshare unless asked.',
    'If asked about background, school, education, resume, work experience, stack, or services, answer only from the profile facts below.',
    'If the user asks about age, birthday, or birth year and it is not explicitly listed in the profile facts, do not guess, estimate, or infer it from graduation years or other hints.',
    'If the exact age is not recorded in the profile facts, say that it is not recorded in the knowledge base.',
    'If the answer is not present in the profile facts, say that you do not have that in the knowledge base yet.',
    'Return valid JSON only with this shape: {"answer":"string","sections":[]}. Keep sections as an empty array unless you are very confident structured sections help.',
    '',
    'PROFILE FACTS',
    profileFacts,
  ].join('\n')
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

  return normalizeAssistantText(content)
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

  return normalizeAssistantText(content)
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

  return normalizeAssistantText(content)
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
    console.warn('all AI provider attempts failed', lastError)
    throw lastError
  }

  throw new Error('No configured AI provider is available for the portfolio assistant.')
}
