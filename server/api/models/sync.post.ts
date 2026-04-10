import { getSupabaseAdmin } from '../../utils/supabase-admin'
import {
  syncAnthropicModels,
  syncDefaultProviderModels,
  syncOpenAIModels,
  syncOpenRouterModels,
} from '../../utils/model-catalog'

type SyncBody = {
  providers?: Array<'openrouter' | 'claude' | 'openai'>
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const syncToken = config.modelCatalogSyncToken || config.n8nAskDonWebhookToken
  const authHeader = getHeader(event, 'authorization')
  const body = (await readBody<SyncBody>(event)) ?? {}

  if (syncToken) {
    const supplied = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : ''
    if (supplied !== syncToken) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized model sync request.',
      })
    }
  }

  const providers = body.providers?.length
    ? body.providers
    : ['openrouter', 'claude', 'openai']

  const supabase = getSupabaseAdmin(event)
  const summary: Record<string, unknown> = {}

  await syncDefaultProviderModels({ supabase })

  if (providers.includes('openrouter')) {
    summary.openrouter = await syncOpenRouterModels({
      supabase,
      openrouterApiKey: config.openrouterApiKey,
    })
  }

  if (providers.includes('claude')) {
    summary.claude = await syncAnthropicModels({
      supabase,
      anthropicApiKey: config.anthropicApiKey,
    })
  }

  if (providers.includes('openai')) {
    summary.openai = await syncOpenAIModels({
      supabase,
      openaiApiKey: config.openaiApiKey,
    })
  }

  return {
    ok: true,
    providers,
    summary,
  }
})
