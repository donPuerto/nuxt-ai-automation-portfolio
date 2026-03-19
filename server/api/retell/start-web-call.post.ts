type StartWebCallResponse = {
  success?: boolean
  message?: string
  access_token?: string
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  if (!config.retellStartCallWebhookUrl || !config.retellAgentId) {
    return {
      ok: false,
      message: 'Book-a-call is not configured yet. Please use the contact page for now.',
    }
  }

  try {
    const headers: Record<string, string> = {}

    if (config.retellStartCallWebhookToken) {
      headers.Authorization = `Bearer ${config.retellStartCallWebhookToken}`
    }

    const response = await $fetch<StartWebCallResponse>(config.retellStartCallWebhookUrl, {
      method: 'POST',
      headers,
      body: {
        agent_id: config.retellAgentId,
      },
    })

    if (!response?.success || !response.access_token) {
      return {
        ok: false,
        message: response?.message || 'We could not start the call right now.',
      }
    }

    return {
      ok: true,
      message: 'Discovery call is ready to start.',
      accessToken: response.access_token,
    }
  }
  catch (error) {
    console.error('retell start-web-call proxy failed', error)

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
      message: upstreamMessage || 'We could not start the call right now. Please try again in a moment.',
    }
  }
})
