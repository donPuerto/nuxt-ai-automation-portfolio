import type { SupabaseClient } from '@supabase/supabase-js'
import type { AiPortfolioPromptAgentOption } from '@@/shared/pages/ai-portfolio'

type OpenRouterModel = {
  id: string
  name?: string
  description?: string
  pricing?: {
    prompt?: string | number
    completion?: string | number
  }
  context_length?: number
}

type OpenRouterModelsResponse = {
  data?: OpenRouterModel[]
}

type AnthropicModel = {
  id: string
  display_name?: string
}

type AnthropicModelsResponse = {
  data?: AnthropicModel[]
}

type OpenAIModel = {
  id: string
}

type OpenAIModelsResponse = {
  data?: OpenAIModel[]
}

type OpenRouterPromptOptionsParams = {
  openrouterApiKey?: string
  freeOnly?: boolean
}

type AnthropicPromptOptionsParams = {
  anthropicApiKey?: string
}

type OpenAIPromptOptionsParams = {
  openaiApiKey?: string
}

type PricePair = {
  inputUsdPerMillion: number
  outputUsdPerMillion: number
}

const toNumber = (value: string | number | undefined) => {
  if (typeof value === 'number')
    return value

  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed))
      return parsed
  }

  return Number.NaN
}

const isFreeModel = (model: OpenRouterModel) => {
  const promptCost = toNumber(model.pricing?.prompt)
  const completionCost = toNumber(model.pricing?.completion)

  return Number.isFinite(promptCost)
    && Number.isFinite(completionCost)
    && promptCost <= 0
    && completionCost <= 0
}

const byDisplayName = (a: OpenRouterModel, b: OpenRouterModel) => {
  const aName = (a.name || a.id).toLowerCase()
  const bName = (b.name || b.id).toLowerCase()
  return aName.localeCompare(bName)
}

const byOptionLabel = (a: AiPortfolioPromptAgentOption, b: AiPortfolioPromptAgentOption) => {
  return a.label.toLowerCase().localeCompare(b.label.toLowerCase())
}

const byPriceThenLabel = (a: AiPortfolioPromptAgentOption, b: AiPortfolioPromptAgentOption) => {
  const aInput = a.inputPriceUsdPerMillion ?? Number.POSITIVE_INFINITY
  const bInput = b.inputPriceUsdPerMillion ?? Number.POSITIVE_INFINITY
  if (aInput !== bInput)
    return aInput - bInput

  const aOutput = a.outputPriceUsdPerMillion ?? Number.POSITIVE_INFINITY
  const bOutput = b.outputPriceUsdPerMillion ?? Number.POSITIVE_INFINITY
  if (aOutput !== bOutput)
    return aOutput - bOutput

  return byOptionLabel(a, b)
}

const KNOWN_MODEL_PRICING: Record<'claude' | 'openai', Array<{ match: RegExp, price: PricePair }>> = {
  claude: [
    { match: /claude[-_]?opus[-_]?4[._-]?(5|6)/i, price: { inputUsdPerMillion: 5, outputUsdPerMillion: 25 } },
    { match: /claude[-_]?haiku[-_]?4([._-]?\d+)?/i, price: { inputUsdPerMillion: 1, outputUsdPerMillion: 5 } },
    { match: /claude[-_]?haiku[-_]?3\.?5/i, price: { inputUsdPerMillion: 0.8, outputUsdPerMillion: 4 } },
    { match: /claude[-_]?sonnet[-_]?4([._-]?\d+)?/i, price: { inputUsdPerMillion: 3, outputUsdPerMillion: 15 } },
    { match: /claude[-_]?sonnet[-_]?3\.?7/i, price: { inputUsdPerMillion: 3, outputUsdPerMillion: 15 } },
    { match: /claude[-_]?opus[-_]?4([._-]?\d+)?/i, price: { inputUsdPerMillion: 15, outputUsdPerMillion: 75 } },
  ],
  openai: [
    { match: /gpt[-_]?5\.?4[-_]?nano/i, price: { inputUsdPerMillion: 0.2, outputUsdPerMillion: 1.25 } },
    { match: /gpt[-_]?5\.?4[-_]?mini/i, price: { inputUsdPerMillion: 0.75, outputUsdPerMillion: 4.5 } },
    { match: /gpt[-_]?5\.?4[-_]?pro/i, price: { inputUsdPerMillion: 30, outputUsdPerMillion: 180 } },
    { match: /gpt[-_]?5\.?4(?![-_]?(nano|mini|pro))/i, price: { inputUsdPerMillion: 2.5, outputUsdPerMillion: 15 } },
    { match: /gpt[-_]?5(?:\.\d+)?[-_]?nano/i, price: { inputUsdPerMillion: 0.05, outputUsdPerMillion: 0.4 } },
    { match: /gpt[-_]?5(?:\.\d+)?[-_]?mini/i, price: { inputUsdPerMillion: 0.25, outputUsdPerMillion: 2 } },
    { match: /gpt[-_]?5(?:\.\d+)?(?![-_]?(nano|mini|pro))/i, price: { inputUsdPerMillion: 1.25, outputUsdPerMillion: 10 } },
    { match: /gpt[-_]?4o[-_]?mini/i, price: { inputUsdPerMillion: 0.15, outputUsdPerMillion: 0.6 } },
    { match: /gpt[-_]?4[-_.]?1[-_]?nano/i, price: { inputUsdPerMillion: 0.1, outputUsdPerMillion: 0.4 } },
    { match: /gpt[-_]?4[-_.]?1[-_]?mini/i, price: { inputUsdPerMillion: 0.4, outputUsdPerMillion: 1.6 } },
    { match: /gpt[-_]?4[-_.]?1(?![-_]?(nano|mini))/i, price: { inputUsdPerMillion: 2, outputUsdPerMillion: 8 } },
    { match: /gpt[-_]?4o(?![-_]?mini)/i, price: { inputUsdPerMillion: 2.5, outputUsdPerMillion: 10 } },
  ],
}

const getKnownPricingForModel = (provider: 'claude' | 'openai', modelId: string): PricePair | null => {
  const matched = KNOWN_MODEL_PRICING[provider].find(item => item.match.test(modelId))
  return matched?.price ?? null
}

const formatUsdPerMillionTokens = (value: number) => {
  if (!Number.isFinite(value) || value <= 0)
    return null

  if (value < 0.01)
    return `$${value.toFixed(4)}`

  if (value < 1)
    return `$${value.toFixed(2)}`

  return `$${value.toFixed(2)}`
}

const buildCompactCostLabel = (inputUsdPerMillion?: number | null, outputUsdPerMillion?: number | null) => {
  const inLabel = typeof inputUsdPerMillion === 'number' ? formatUsdPerMillionTokens(inputUsdPerMillion) : null
  const outLabel = typeof outputUsdPerMillion === 'number' ? formatUsdPerMillionTokens(outputUsdPerMillion) : null

  if (inLabel && outLabel)
    return `${inLabel} / ${outLabel} per 1M`
  if (inLabel)
    return `${inLabel} input per 1M`
  if (outLabel)
    return `${outLabel} output per 1M`

  return undefined
}

const pricingFromPerToken = (inputPrice?: number | null, outputPrice?: number | null): PricePair | null => {
  if (typeof inputPrice !== 'number' && typeof outputPrice !== 'number')
    return null

  return {
    inputUsdPerMillion: typeof inputPrice === 'number' ? inputPrice * 1_000_000 : Number.NaN,
    outputUsdPerMillion: typeof outputPrice === 'number' ? outputPrice * 1_000_000 : Number.NaN,
  }
}

const extractModelReleaseDate = (modelId: string) => {
  const match = modelId.match(/(?:^|[-_])((?:20)\d{2})(\d{2})(\d{2})(?:$|[-_])/)
  if (!match)
    return null

  return `${match[1]}-${match[2]}-${match[3]}`
}

const isObsoleteModel = (provider: 'openrouter' | 'claude' | 'openai', modelId: string) => {
  const normalized = modelId.toLowerCase()
  if (normalized.includes('deprecated') || normalized.includes('legacy'))
    return true

  if (provider === 'claude')
    return !/(claude[-_])?(haiku|sonnet|opus)[-_]4/.test(normalized)

  if (provider === 'openai') {
    if (/(image|audio|tts|transcribe|realtime|search|embedding|moderation)/.test(normalized))
      return true

    return !/(gpt[-_]?5|gpt[-_]?4[-_.]?1|gpt[-_]?4o)/.test(normalized)
  }

  return false
}

const isDisplayableOpenAIModel = (id: string) => {
  const normalized = id.toLowerCase()
  if (isObsoleteModel('openai', normalized))
    return false

  return normalized.includes('gpt')
    || normalized.startsWith('o1')
    || normalized.startsWith('o3')
    || normalized.startsWith('o4')
}

const defaultProviderModels = () => ([
  {
    provider: 'claude',
    model_id: 'claude-sonnet-4-5',
    label: 'Claude Sonnet 4.5',
    description: 'Claude Sonnet 4.5 default model.',
    is_free: false,
    context_window: null,
  },
  {
    provider: 'openai',
    model_id: 'openai-gpt-4-1-mini',
    label: 'OpenAI GPT-4.1 mini',
    description: 'OpenAI GPT-4.1 mini default model.',
    is_free: false,
    context_window: null,
  },
] as const)

export async function getOpenRouterPromptOptions({
  openrouterApiKey,
  freeOnly = true,
}: OpenRouterPromptOptionsParams): Promise<AiPortfolioPromptAgentOption[]> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (openrouterApiKey)
    headers.Authorization = `Bearer ${openrouterApiKey}`

  const response = await $fetch<OpenRouterModelsResponse>('https://openrouter.ai/api/v1/models', { headers })
  const rawModels = (response.data ?? []).filter(model => model.id)
  const sorted = rawModels.sort(byDisplayName)

  const picked = freeOnly ? sorted.filter(isFreeModel) : sorted

  return picked.map((model) => {
    const modelId = model.id
    const promptPrice = toNumber(model.pricing?.prompt)
    const completionPrice = toNumber(model.pricing?.completion)
    const pricing = pricingFromPerToken(
      Number.isFinite(promptPrice) ? promptPrice : null,
      Number.isFinite(completionPrice) ? completionPrice : null,
    )
    const costLabel = buildCompactCostLabel(pricing?.inputUsdPerMillion, pricing?.outputUsdPerMillion)

    return {
      id: modelId.startsWith('openrouter:') ? modelId : `openrouter:${modelId}`,
      label: model.name || modelId,
      description: `OpenRouter model (${modelId})`,
      costLabel: costLabel || (isFreeModel(model) ? 'Free' : undefined),
      inputPriceUsdPerMillion: pricing?.inputUsdPerMillion,
      outputPriceUsdPerMillion: pricing?.outputUsdPerMillion,
      releaseDate: extractModelReleaseDate(modelId) ?? undefined,
      isObsolete: isObsoleteModel('openrouter', modelId),
      requiresAuth: !isFreeModel(model),
      available: true,
      provider: 'openrouter',
    }
  })
}

export async function getAnthropicPromptOptions({
  anthropicApiKey,
}: AnthropicPromptOptionsParams): Promise<AiPortfolioPromptAgentOption[]> {
  if (!anthropicApiKey)
    return []

  const response = await $fetch<AnthropicModelsResponse>('https://api.anthropic.com/v1/models', {
    headers: {
      'x-api-key': anthropicApiKey,
      'anthropic-version': '2023-06-01',
      Accept: 'application/json',
    },
  })

  const rawModels = (response.data ?? [])
    .filter(model => model.id && !isObsoleteModel('claude', model.id))

  const options: AiPortfolioPromptAgentOption[] = rawModels.map((model) => {
    const modelId = model.id
    const knownPricing = getKnownPricingForModel('claude', modelId)
    const costLabel = buildCompactCostLabel(knownPricing?.inputUsdPerMillion ?? null, knownPricing?.outputUsdPerMillion ?? null)
    return {
      id: modelId,
      label: model.display_name || modelId,
      description: `Anthropic model (${modelId})`,
      costLabel,
      inputPriceUsdPerMillion: knownPricing?.inputUsdPerMillion,
      outputPriceUsdPerMillion: knownPricing?.outputUsdPerMillion,
      releaseDate: extractModelReleaseDate(modelId) ?? undefined,
      isObsolete: isObsoleteModel('claude', modelId),
      requiresAuth: true,
      available: true,
      provider: 'claude' as const,
    }
  })

  return options.sort(byPriceThenLabel)
}

export async function getOpenAIPromptOptions({
  openaiApiKey,
}: OpenAIPromptOptionsParams): Promise<AiPortfolioPromptAgentOption[]> {
  if (!openaiApiKey)
    return []

  const response = await $fetch<OpenAIModelsResponse>('https://api.openai.com/v1/models', {
    headers: {
      Authorization: `Bearer ${openaiApiKey}`,
      Accept: 'application/json',
    },
  })

  const rawModels = (response.data ?? [])
    .filter(model => model.id && isDisplayableOpenAIModel(model.id))

  const options: AiPortfolioPromptAgentOption[] = rawModels.map((model) => {
    const modelId = model.id
    const knownPricing = getKnownPricingForModel('openai', modelId)
    const costLabel = buildCompactCostLabel(knownPricing?.inputUsdPerMillion ?? null, knownPricing?.outputUsdPerMillion ?? null)
    return {
      id: modelId,
      label: modelId,
      description: `OpenAI model (${modelId})`,
      costLabel,
      inputPriceUsdPerMillion: knownPricing?.inputUsdPerMillion,
      outputPriceUsdPerMillion: knownPricing?.outputUsdPerMillion,
      releaseDate: extractModelReleaseDate(modelId) ?? undefined,
      isObsolete: isObsoleteModel('openai', modelId),
      requiresAuth: true,
      available: true,
      provider: 'openai' as const,
    }
  })

  return options.sort(byPriceThenLabel)
}

export async function syncOpenRouterModels({
  supabase,
  openrouterApiKey,
}: {
  supabase: SupabaseClient
  openrouterApiKey?: string
}) {
  const startedAt = new Date().toISOString()
  const runStart = await supabase
    .from('ai_model_sync_runs')
    .insert({
      provider: 'openrouter',
      status: 'running',
      source: 'openrouter-api',
      started_at: startedAt,
    })
    .select('id')
    .single()

  const runId = runStart.data?.id as string | undefined

  try {
    const headers: Record<string, string> = { Accept: 'application/json' }
    if (openrouterApiKey)
      headers.Authorization = `Bearer ${openrouterApiKey}`

    const response = await $fetch<OpenRouterModelsResponse>('https://openrouter.ai/api/v1/models', { headers })
    const rawModels = (response.data ?? []).filter(model => model.id)
    const sorted = rawModels.sort(byDisplayName)

    const upsertRows = sorted.map((model) => {
      const isObsolete = isObsoleteModel('openrouter', model.id)

      return {
        provider: 'openrouter',
        model_id: model.id,
        label: model.name || model.id,
        description: model.description || `OpenRouter model (${model.id})`,
        is_free: isFreeModel(model),
        is_active: true,
        is_displayable: !isObsolete,
        is_deprecated: isObsolete,
        is_obsolete: isObsolete,
        release_date: extractModelReleaseDate(model.id),
        input_price: Number.isFinite(toNumber(model.pricing?.prompt)) ? toNumber(model.pricing?.prompt) : null,
        output_price: Number.isFinite(toNumber(model.pricing?.completion)) ? toNumber(model.pricing?.completion) : null,
        context_window: typeof model.context_length === 'number' && model.context_length > 0 ? model.context_length : null,
        capabilities: {},
        metadata: {},
        last_seen_at: new Date().toISOString(),
      }
    })

    if (upsertRows.length) {
      const { error: upsertError } = await supabase
        .from('ai_models_catalog')
        .upsert(upsertRows, { onConflict: 'provider,model_id' })

      if (upsertError)
        throw upsertError
    }

    const { error: hideMissingError } = await supabase
      .from('ai_models_catalog')
      .update({
        is_active: false,
        is_displayable: false,
        is_deprecated: true,
      })
      .eq('provider', 'openrouter')
      .lt('last_seen_at', startedAt)

    if (hideMissingError)
      throw hideMissingError

    if (runId) {
      await supabase
        .from('ai_model_sync_runs')
        .update({
          status: 'success',
          fetched_count: rawModels.length,
          upserted_count: upsertRows.length,
          finished_at: new Date().toISOString(),
        })
        .eq('id', runId)
    }

    return {
      provider: 'openrouter',
      fetched: rawModels.length,
      upserted: upsertRows.length,
    }
  }
  catch (error) {
    if (runId) {
      await supabase
        .from('ai_model_sync_runs')
        .update({
          status: 'error',
          error_message: error instanceof Error ? error.message : 'Unknown sync error',
          finished_at: new Date().toISOString(),
        })
        .eq('id', runId)
    }

    throw error
  }
}

async function syncProviderCatalogFromOptions({
  supabase,
  provider,
  options,
}: {
  supabase: SupabaseClient
  provider: 'claude' | 'openai'
  options: AiPortfolioPromptAgentOption[]
}) {
  const startedAt = new Date().toISOString()
  const source = provider === 'claude' ? 'anthropic-api' : 'openai-api'

  const runStart = await supabase
    .from('ai_model_sync_runs')
    .insert({
      provider,
      status: 'running',
      source,
      started_at: startedAt,
    })
    .select('id')
    .single()

  const runId = runStart.data?.id as string | undefined

  try {
    if (options.length) {
      const upsertRows = options.map(option => ({
        provider,
        model_id: option.id,
        label: option.label,
        description: option.description || `${provider} model`,
        is_free: false,
        is_active: true,
        is_displayable: !option.isObsolete,
        is_deprecated: Boolean(option.isObsolete),
        is_obsolete: Boolean(option.isObsolete),
        release_date: option.releaseDate ?? null,
        input_price: typeof option.inputPriceUsdPerMillion === 'number' ? option.inputPriceUsdPerMillion / 1_000_000 : null,
        output_price: typeof option.outputPriceUsdPerMillion === 'number' ? option.outputPriceUsdPerMillion / 1_000_000 : null,
        context_window: null,
        capabilities: {},
        metadata: {},
        last_seen_at: new Date().toISOString(),
      }))

      const { error: upsertError } = await supabase
        .from('ai_models_catalog')
        .upsert(upsertRows, { onConflict: 'provider,model_id' })

      if (upsertError)
        throw upsertError
    }

    const { error: hideMissingError } = await supabase
      .from('ai_models_catalog')
      .update({
        is_active: false,
        is_displayable: false,
        is_deprecated: true,
      })
      .eq('provider', provider)
      .lt('last_seen_at', startedAt)

    if (hideMissingError)
      throw hideMissingError

    if (runId) {
      await supabase
        .from('ai_model_sync_runs')
        .update({
          status: 'success',
          fetched_count: options.length,
          upserted_count: options.length,
          finished_at: new Date().toISOString(),
        })
        .eq('id', runId)
    }

    return {
      provider,
      fetched: options.length,
      upserted: options.length,
      source,
    }
  }
  catch (error) {
    if (runId) {
      await supabase
        .from('ai_model_sync_runs')
        .update({
          status: 'error',
          error_message: error instanceof Error ? error.message : 'Unknown sync error',
          finished_at: new Date().toISOString(),
        })
        .eq('id', runId)
    }

    throw error
  }
}

export async function syncAnthropicModels({
  supabase,
  anthropicApiKey,
}: {
  supabase: SupabaseClient
  anthropicApiKey?: string
}) {
  const options = await getAnthropicPromptOptions({ anthropicApiKey })
  if (!options.length) {
    return {
      provider: 'claude',
      fetched: 0,
      upserted: 0,
      source: 'missing-api-key-or-empty',
    }
  }

  return syncProviderCatalogFromOptions({
    supabase,
    provider: 'claude',
    options,
  })
}

export async function syncOpenAIModels({
  supabase,
  openaiApiKey,
}: {
  supabase: SupabaseClient
  openaiApiKey?: string
}) {
  const options = await getOpenAIPromptOptions({ openaiApiKey })
  if (!options.length) {
    return {
      provider: 'openai',
      fetched: 0,
      upserted: 0,
      source: 'missing-api-key-or-empty',
    }
  }

  return syncProviderCatalogFromOptions({
    supabase,
    provider: 'openai',
    options,
  })
}

export async function syncDefaultProviderModels({
  supabase,
}: {
  supabase: SupabaseClient
}) {
  const rows = defaultProviderModels().map((model) => {
    const pricing = getKnownPricingForModel(model.provider, model.model_id)

    return {
      ...model,
      is_active: true,
      is_displayable: true,
      is_deprecated: false,
      is_obsolete: false,
      release_date: null,
      input_price: pricing ? pricing.inputUsdPerMillion / 1_000_000 : null,
      output_price: pricing ? pricing.outputUsdPerMillion / 1_000_000 : null,
      capabilities: {},
      metadata: {},
      last_seen_at: new Date().toISOString(),
    }
  })

  if (!rows.length)
    return { upserted: 0 }

  const { error } = await supabase
    .from('ai_models_catalog')
    .upsert(rows, { onConflict: 'provider,model_id' })

  if (error)
    throw error

  return { upserted: rows.length }
}

export type CatalogModelRow = {
  id: string
  provider: 'openrouter' | 'claude' | 'openai'
  model_id: string
  label: string
  description: string | null
  is_free: boolean
  input_price?: number | null
  output_price?: number | null
  release_date?: string | null
  is_obsolete?: boolean | null
}

export function toPromptOptions(rows: CatalogModelRow[]): AiPortfolioPromptAgentOption[] {
  return rows.map((row) => {
    const id = row.provider === 'openrouter' && !row.model_id.startsWith('openrouter:')
      ? `openrouter:${row.model_id}`
      : row.model_id
    const pricing = pricingFromPerToken(row.input_price ?? null, row.output_price ?? null)

    return {
      id,
      label: row.label,
      description: row.description || `${row.provider} model`,
      costLabel: buildCompactCostLabel(pricing?.inputUsdPerMillion, pricing?.outputUsdPerMillion) || (row.is_free ? 'Free' : undefined),
      inputPriceUsdPerMillion: pricing?.inputUsdPerMillion,
      outputPriceUsdPerMillion: pricing?.outputUsdPerMillion,
      releaseDate: row.release_date ?? undefined,
      isObsolete: Boolean(row.is_obsolete),
      requiresAuth: !row.is_free,
      available: !row.is_obsolete,
      provider: row.provider,
    }
  })
}
