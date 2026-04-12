type RawNewsItem = {
  title: string
  url: string
  sourceLabel: string
  publishedAt: string | null
}

type StoredNewsItem = {
  title: string
  url: string
  source_label: string
  summary: string | null
  provider: 'claude'
  is_active: boolean
  published_at: string | null
}

const GOOGLE_NEWS_RSS_URL = 'https://news.google.com/rss/search?q=Anthropic%20Claude&hl=en-US&gl=US&ceid=US:en'

const stripCdata = (value: string) => value.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim()

const decodeXml = (value: string) => value
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, '\'')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')

const parseRssTag = (item: string, tag: string): string | null => {
  const match = item.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i'))
  if (!match?.[1]) {
    return null
  }

  return decodeXml(stripCdata(match[1]))
}

const normalizeTickerTitle = (value: string) => {
  return value
    .replace(/\s+/g, ' ')
    .replace(/\s+-\s+[^-]+$/, '')
    .trim()
}

export const getSeedNewsItems = (): StoredNewsItem[] => {
  return [
    {
      title: 'Claude tools are getting more agent-native',
      url: 'https://www.anthropic.com/news',
      source_label: 'Anthropic',
      summary: null,
      provider: 'claude',
      is_active: true,
      published_at: null,
    },
    {
      title: 'Teams are using Claude for tighter internal copilots',
      url: 'https://www.anthropic.com/customers',
      source_label: 'Anthropic',
      summary: null,
      provider: 'claude',
      is_active: true,
      published_at: null,
    },
    {
      title: 'Claude API workflows keep leaning toward tool use',
      url: 'https://docs.anthropic.com/',
      source_label: 'Anthropic Docs',
      summary: null,
      provider: 'claude',
      is_active: true,
      published_at: null,
    },
  ]
}

export const fetchClaudeNewsCandidates = async (limit = 20): Promise<RawNewsItem[]> => {
  const xml = await $fetch<string>(GOOGLE_NEWS_RSS_URL, {
    responseType: 'text',
  })

  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
    .map((match): RawNewsItem | null => {
      const item = match[1]

      if (!item) {
        return null
      }

      const title = normalizeTickerTitle(parseRssTag(item, 'title') ?? '')
      const url = parseRssTag(item, 'link') ?? ''

      if (!title || !url) {
        return null
      }

      return {
        title,
        url,
        sourceLabel: parseRssTag(item, 'source') ?? 'Google News',
        publishedAt: parseRssTag(item, 'pubDate'),
      }
    })
    .filter((item): item is RawNewsItem => Boolean(item))

  const deduped = items.filter((item, index, list) => {
    return list.findIndex(candidate => candidate.url === item.url || candidate.title === item.title) === index
  })

  return deduped.slice(0, limit)
}

export const getLatestClaudeNewsItems = async ({
  limit = 20,
  openrouterApiKey,
}: {
  limit?: number
  openrouterApiKey?: string
}): Promise<StoredNewsItem[]> => {
  const candidates = await fetchClaudeNewsCandidates(limit).catch(() => [])

  if (!candidates.length) {
    return getSeedNewsItems().slice(0, limit)
  }

  return rewriteNewsTitlesWithOpenRouter({
    items: candidates.slice(0, limit),
    openrouterApiKey,
  })
}

export const rewriteNewsTitlesWithOpenRouter = async ({
  items,
  openrouterApiKey,
}: {
  items: RawNewsItem[]
  openrouterApiKey?: string
}): Promise<StoredNewsItem[]> => {
  if (!items.length) {
    return []
  }

  if (!openrouterApiKey) {
    return items.map(item => ({
      title: item.title,
      url: item.url,
      source_label: item.sourceLabel,
      summary: item.title,
      provider: 'claude',
      is_active: true,
      published_at: item.publishedAt,
    }))
  }

  const prompt = [
    'Rewrite each AI news headline into a compact ticker title.',
    'Rules:',
    '- Keep it factual and based only on the provided headline.',
    '- Keep each title under 72 characters.',
    '- Return JSON only.',
    '- Format: {"items":[{"title":"..."}]}',
    '',
    JSON.stringify({
      items: items.map(item => ({ title: item.title })),
    }),
  ].join('\n')

  const response = await $fetch<{
    choices?: Array<{
      message?: {
        content?: string
      }
    }>
  }>('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openrouterApiKey}`,
      'Content-Type': 'application/json',
    },
    body: {
      model: 'openai/gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You rewrite headlines into compact UI ticker copy and return strict JSON.',
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
    return items.map(item => ({
      title: item.title,
      url: item.url,
      source_label: item.sourceLabel,
      summary: item.title,
      provider: 'claude',
      is_active: true,
      published_at: item.publishedAt,
    }))
  }

  const parsed = JSON.parse(content) as { items?: Array<{ title?: string }> }

  return items.map((item, index) => ({
    title: normalizeTickerTitle(parsed.items?.[index]?.title?.trim() || item.title),
    url: item.url,
    source_label: item.sourceLabel,
    summary: item.title,
    provider: 'claude',
    is_active: true,
    published_at: item.publishedAt,
  }))
}
