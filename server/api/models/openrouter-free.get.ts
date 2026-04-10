export default defineEventHandler(async (event) => {
  try {
    const result = await $fetch<{
      ok: boolean
      count: number
      models: Array<{
        id: string
        label: string
        description: string
        available: boolean
        provider: 'openrouter' | 'claude' | 'openai'
      }>
    }>('/api/models/available?provider=openrouter&freeOnly=true&autoSync=true', {
      headers: {
        cookie: getHeader(event, 'cookie') || '',
      },
    })

    return {
      ok: result.ok,
      count: result.count,
      models: result.models,
    }
  }
  catch (error) {
    console.warn('openrouter free models fetch failed (catalog)', error)

    return {
      ok: false,
      count: 0,
      models: [],
    }
  }
})
