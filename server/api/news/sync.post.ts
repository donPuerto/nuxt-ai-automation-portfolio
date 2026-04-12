import { getSupabaseAdmin } from '../../utils/supabase-admin'
import { fetchClaudeNewsCandidates, getSeedNewsItems, rewriteNewsTitlesWithOpenRouter } from '../../utils/news-feed'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const syncToken = config.modelCatalogSyncToken || config.n8nAskDonWebhookToken
  const authHeader = getHeader(event, 'authorization')

  if (syncToken) {
    const supplied = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : ''
    if (supplied !== syncToken) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized news sync request.',
      })
    }
  }

  const supabase = getSupabaseAdmin(event)
  const requestedLimit = Math.min(Math.max(Number((await readBody<{ limit?: number }>(event).catch(() => null))?.limit ?? 20) || 20, 1), 20)

  const candidates = await fetchClaudeNewsCandidates(requestedLimit).catch(() => [])
  const normalized = candidates.length
    ? await rewriteNewsTitlesWithOpenRouter({
        items: candidates,
        openrouterApiKey: config.openrouterApiKey,
      })
    : getSeedNewsItems().slice(0, requestedLimit)

  const { error: disableError } = await supabase
    .from('ai_news_feed')
    .update({ is_active: false })
    .eq('provider', 'claude')

  if (disableError) {
    throw createError({
      statusCode: 500,
      statusMessage: disableError.message,
    })
  }

  const payload = normalized.slice(0, requestedLimit).map(item => ({
    title: item.title,
    url: item.url,
    source_label: item.source_label,
    summary: item.summary,
    provider: 'claude',
    is_active: true,
    published_at: item.published_at,
  }))

  const { data, error } = await supabase
    .from('ai_news_feed')
    .insert(payload)
    .select('id,title,url,source_label,published_at')

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  return {
    ok: true,
    count: data?.length ?? 0,
    items: data ?? [],
  }
})
