import type { PortfolioAssistantResponse, PortfolioAssistantRequest } from '../../utils/portfolio-assistant/types'
import { buildPortfolioAssistantResponse } from '../../utils/portfolio-assistant/build-response'

type AssistantApiResult = {
  ok?: boolean
  message?: string
  response?: PortfolioAssistantResponse
  answer?: string
  sections?: PortfolioAssistantResponse['sections']
}

const toMessage = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: { message?: string } }).data
    if (data?.message) {
      return data.message
    }
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: string }).message
    if (message) {
      return message
    }
  }

  return ''
}

const normalizeResponse = (payload: AssistantApiResult): PortfolioAssistantResponse | null => {
  if (payload.response?.answer && Array.isArray(payload.response.sections)) {
    return payload.response
  }

  if (payload.answer && Array.isArray(payload.sections)) {
    return {
      answer: payload.answer,
      sections: payload.sections,
    }
  }

  return null
}

export default defineEventHandler(async (event) => {
  const body = (await readBody<PortfolioAssistantRequest>(event)) ?? {}
  const config = useRuntimeConfig(event)

  if (config.n8nAskDonWebhookUrl) {
    try {
      const upstream = await $fetch<AssistantApiResult>(config.n8nAskDonWebhookUrl, {
        method: 'POST',
        headers: config.n8nAskDonWebhookToken
          ? {
              Authorization: `Bearer ${config.n8nAskDonWebhookToken}`,
            }
          : undefined,
        body: {
          source: 'ai-portfolio-prompt',
          prompt: body.prompt ?? '',
          intent: body.intent ?? 'prompt',
          categoryId: body.categoryId ?? null,
          agentId: body.agentId ?? null,
          attachments: body.attachments ?? [],
          path: getHeader(event, 'referer') ?? '/',
          triggeredAt: new Date().toISOString(),
          userAgent: getHeader(event, 'user-agent') ?? '',
        },
      })

      const normalized = normalizeResponse(upstream)

      if (normalized) {
        return {
          ok: true,
          message: upstream.message || 'Portfolio assistant response ready.',
          response: normalized,
          provider: 'n8n',
        }
      }

      console.warn('ask-don webhook returned unexpected shape, using fallback', upstream)
    }
    catch (error) {
      console.warn('ask-don webhook failed, using fallback', toMessage(error) || error)
    }
  }

  try {
    const response = buildPortfolioAssistantResponse(body)

    return {
      ok: true,
      message: 'Portfolio assistant response ready (fallback).',
      response,
      provider: 'local-fallback',
    }
  }
  catch (error) {
    console.error('portfolio assistant respond failed', error)

    return {
      ok: false,
      message: toMessage(error) || 'We could not load the portfolio response right now.',
    }
  }
})
