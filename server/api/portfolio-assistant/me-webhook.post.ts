import type { AiPortfolioNavIntent } from '@@/shared'

type MeWebhookRequest = {
  intent: AiPortfolioNavIntent
  label: string
  prompt?: string
  path?: string
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  if (!config.n8nAskDonWebhookUrl) {
    return {
      ok: false,
      message: 'Ask Don webhook is not configured yet.',
    }
  }

  try {
    const body = await readBody<MeWebhookRequest>(event)
    const response = await $fetch.raw(config.n8nAskDonWebhookUrl, {
      method: 'POST',
      headers: config.n8nAskDonWebhookToken
        ? {
            Authorization: `Bearer ${config.n8nAskDonWebhookToken}`,
          }
        : undefined,
      ignoreResponseError: true,
      body: {
        intent: body?.intent ?? 'me',
        label: body?.label ?? 'Me',
        prompt: body?.prompt ?? '',
        path: body?.path ?? '/',
        source: 'ai-portfolio-nav',
        triggeredAt: new Date().toISOString(),
        userAgent: getHeader(event, 'user-agent') ?? '',
      },
    })

    if (!response.ok) {
      const message
        = typeof response._data === 'object'
          && response._data !== null
          && 'message' in response._data
          && typeof response._data.message === 'string'
          ? response._data.message
          : `Ask Don webhook returned ${response.status}.`

      console.warn('ask don me webhook unavailable', {
        status: response.status,
        message,
      })

      return {
        ok: false,
        message,
      }
    }

    return {
      ok: true,
      message: 'Ask Don webhook sent.',
    }
  }
  catch (error) {
    const upstreamMessage
      = typeof error === 'object'
        && error !== null
        && 'data' in error
        && typeof error.data === 'object'
        && error.data !== null
        && 'message' in error.data
        && typeof error.data.message === 'string'
        ? error.data.message
        : typeof error === 'object'
            && error !== null
            && 'message' in error
            && typeof error.message === 'string'
          ? error.message
          : ''

    return {
      ok: false,
      message: upstreamMessage || 'We could not send the Ask Don webhook right now.',
    }
  }
})
