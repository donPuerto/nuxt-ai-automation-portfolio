import { getSupabaseAdmin } from '../../utils/supabase-admin'
import { getLatestClaudeNewsItems, getSeedNewsItems } from '../../utils/news-feed'

type NewsRow = {
  id: string
  title: string
  url: string
  source_label: string | null
  published_at: string | null
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const limit = Math.min(Math.max(Number(getQuery(event).limit ?? 20) || 20, 1), 20)

  const buildFallbackItems = async () => {
    const items = await getLatestClaudeNewsItems({
      limit,
      openrouterApiKey: config.openrouterApiKey,
    }).catch(() => getSeedNewsItems().slice(0, limit))

    return items.map((item, index) => ({
      id: `fallback-${index + 1}`,
      title: item.title,
      url: item.url,
      sourceLabel: item.source_label,
      publishedAt: item.published_at,
      seeded: item.summary === null,
    }))
  }

  if (!config.public.supabaseUrl || !config.supabaseServiceRoleKey) {
    return {
      ok: true,
      items: await buildFallbackItems(),
    }
  }

  try {
    const supabase = getSupabaseAdmin(event)
    const { data, error } = await supabase
      .from('ai_news_feed')
      .select('id,title,url,source_label,published_at')
      .eq('is_active', true)
      .eq('provider', 'claude')
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    const items = ((data ?? []) as NewsRow[]).map(item => ({
      id: item.id,
      title: item.title,
      url: item.url,
      sourceLabel: item.source_label,
      publishedAt: item.published_at,
      seeded: false,
    }))

    if (!items.length) {
      return {
        ok: true,
        items: await buildFallbackItems(),
      }
    }

    return {
      ok: true,
      items,
    }
  }
  catch {
    return {
      ok: true,
      items: await buildFallbackItems(),
    }
  }
})
