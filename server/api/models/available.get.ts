import { aiPortfolioContent } from '@@/shared'
import { getSupabaseAdmin } from '../../utils/supabase-admin'
import {
  getAnthropicPromptOptions,
  getOpenAIPromptOptions,
  getOpenRouterPromptOptions,
  syncAnthropicModels,
  syncDefaultProviderModels,
  syncOpenAIModels,
  syncOpenRouterModels,
  toPromptOptions,
  type CatalogModelRow,
} from '../../utils/model-catalog'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const provider = typeof query.provider === 'string' ? query.provider : undefined
  const freeOnly = query.freeOnly === 'true' || query.freeOnly === '1'
  const autoSync = query.autoSync === 'true' || query.autoSync === '1'
  const config = useRuntimeConfig(event)

  // Provider-first live fallback keeps dropdown usable even if DB catalog tables are not migrated yet.
  if (provider === 'claude') {
    try {
      const liveOptions = await getAnthropicPromptOptions({
        anthropicApiKey: config.anthropicApiKey,
      })
      if (liveOptions.length) {
        return {
          ok: true,
          count: liveOptions.length,
          models: liveOptions,
          source: 'anthropic-live-direct',
        }
      }
    }
    catch (error) {
      console.warn('anthropic provider-first fetch failed', error)
    }
  }

  if (provider === 'openai') {
    try {
      const liveOptions = await getOpenAIPromptOptions({
        openaiApiKey: config.openaiApiKey,
      })
      if (liveOptions.length) {
        return {
          ok: true,
          count: liveOptions.length,
          models: liveOptions,
          source: 'openai-live-direct',
        }
      }
    }
    catch (error) {
      console.warn('openai provider-first fetch failed', error)
    }
  }

  try {
    const supabase = getSupabaseAdmin(event)

    if (autoSync) {
      await syncDefaultProviderModels({ supabase })
      await syncOpenRouterModels({
        supabase,
        openrouterApiKey: config.openrouterApiKey,
      })
      await syncAnthropicModels({
        supabase,
        anthropicApiKey: config.anthropicApiKey,
      })
      await syncOpenAIModels({
        supabase,
        openaiApiKey: config.openaiApiKey,
      })
    }

    let dbQuery = supabase
      .from('ai_models_catalog')
      .select('id,provider,model_id,label,description,is_free,input_price,output_price,release_date,is_obsolete')
      .eq('is_active', true)
      .eq('is_displayable', true)
      .eq('is_obsolete', false)

    if (provider === 'openrouter' || provider === 'claude' || provider === 'openai') {
      dbQuery = dbQuery.eq('provider', provider)
    }

    if (freeOnly) {
      dbQuery = dbQuery.eq('is_free', true)
    }

    const { data, error } = await dbQuery
      .order('input_price', { ascending: true, nullsFirst: false })
      .order('output_price', { ascending: true, nullsFirst: false })
      .order('label', { ascending: true })

    if (error)
      throw error

    const rows = (data ?? []) as CatalogModelRow[]
    const options = toPromptOptions(rows)

    if (!options.length) {
      if (provider === 'openrouter') {
        const liveOptions = await getOpenRouterPromptOptions({
          openrouterApiKey: config.openrouterApiKey,
          freeOnly,
        })

        if (liveOptions.length) {
          return {
            ok: true,
            count: liveOptions.length,
            models: liveOptions,
            source: 'openrouter-live',
          }
        }
      }
      else if (provider === 'claude') {
        const liveOptions = await getAnthropicPromptOptions({
          anthropicApiKey: config.anthropicApiKey,
        })

        if (liveOptions.length) {
          return {
            ok: true,
            count: liveOptions.length,
            models: liveOptions,
            source: 'anthropic-live',
          }
        }
      }
      else if (provider === 'openai') {
        const liveOptions = await getOpenAIPromptOptions({
          openaiApiKey: config.openaiApiKey,
        })

        if (liveOptions.length) {
          return {
            ok: true,
            count: liveOptions.length,
            models: liveOptions,
            source: 'openai-live',
          }
        }
      }

      return {
        ok: true,
        count: aiPortfolioContent.promptAgentOptions.length,
        models: aiPortfolioContent.promptAgentOptions,
        source: 'fallback-static',
      }
    }

    return {
      ok: true,
      count: options.length,
      models: options,
      source: 'db-catalog',
    }
  }
  catch (error) {
    console.warn('model catalog read failed, using fallback', error)

    if (provider === 'openrouter') {
      try {
        const liveOptions = await getOpenRouterPromptOptions({
          openrouterApiKey: config.openrouterApiKey,
          freeOnly,
        })

        if (liveOptions.length) {
          return {
            ok: true,
            count: liveOptions.length,
            models: liveOptions,
            source: 'openrouter-live-fallback',
          }
        }
      }
      catch (liveError) {
        console.warn('openrouter live fetch failed, using static fallback', liveError)
      }
    }
    else if (provider === 'claude') {
      try {
        const liveOptions = await getAnthropicPromptOptions({
          anthropicApiKey: config.anthropicApiKey,
        })

        if (liveOptions.length) {
          return {
            ok: true,
            count: liveOptions.length,
            models: liveOptions,
            source: 'anthropic-live-fallback',
          }
        }
      }
      catch (liveError) {
        console.warn('anthropic live fetch failed, using static fallback', liveError)
      }
    }
    else if (provider === 'openai') {
      try {
        const liveOptions = await getOpenAIPromptOptions({
          openaiApiKey: config.openaiApiKey,
        })

        if (liveOptions.length) {
          return {
            ok: true,
            count: liveOptions.length,
            models: liveOptions,
            source: 'openai-live-fallback',
          }
        }
      }
      catch (liveError) {
        console.warn('openai live fetch failed, using static fallback', liveError)
      }
    }

    return {
      ok: true,
      count: aiPortfolioContent.promptAgentOptions.length,
      models: aiPortfolioContent.promptAgentOptions,
      source: 'fallback-static',
    }
  }
})
