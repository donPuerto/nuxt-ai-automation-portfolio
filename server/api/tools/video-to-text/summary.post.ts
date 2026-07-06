type SummaryRequest = {
  transcript?: string
  sourceUrl?: string
  transcriber?: string
}

type SummaryResponse = {
  ok: boolean
  summary: string
  highlights: string[]
}

type AiProvider = 'openrouter' | 'openai' | 'claude'

const normalizeSummaryPayload = (payload: unknown): SummaryResponse | null => {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const candidate = payload as {
    summary?: unknown
    highlights?: unknown
  }

  const summary = typeof candidate.summary === 'string' ? candidate.summary.trim() : ''
  if (!summary) {
    return null
  }

  const highlights = Array.isArray(candidate.highlights)
    ? candidate.highlights
      .map(item => typeof item === 'string' ? item.trim() : '')
      .filter(Boolean)
      .slice(0, 6)
    : []

  return {
    ok: true,
    summary,
    highlights,
  }
}

const normalizeJsonFromText = (value: string) => {
  const trimmed = value.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim()
  const jsonText = fenced || trimmed

  return JSON.parse(jsonText) as unknown
}

const buildPrompt = (transcript: string, sourceUrl?: string, transcriber?: string) => {
  return [
    'Summarize the transcript below in a detailed, high-clarity way.',
    'Return strict JSON only in this exact shape: {"summary":"string","highlights":["string"]}.',
    'Make the summary feel like a polished meeting or call summary, similar to a strong Fathom-style recap.',
    'Target roughly 260 to 480 words.',
    'Format the summary string into clearly labeled sections separated by blank lines.',
    'Use these section labels exactly when relevant: Overview:, Key Points:, Action Items:, Decisions:, Notable Quotes:.',
    'If a section has no meaningful content, omit it except for Action Items and Decisions, where you should write "None noted."',
    'Make the summary useful for someone who wants to understand and act on the video, not just skim it.',
    'If the transcript contains instructions, steps, tactics, or advice, convert them into a clear instruction-style summary.',
    'Cover the main topic, the important supporting points, any step-by-step process, important decisions, warnings, and the practical takeaway.',
    'Do not invent details that are not in the transcript.',
    'Keep highlights to 4-6 bullets.',
    'Each highlight should be specific and actionable, not generic.',
    'Do not include markdown.',
    'Do not wrap the JSON in code fences.',
    sourceUrl ? `Source URL: ${sourceUrl}` : '',
    transcriber ? `Transcriber: ${transcriber}` : '',
    '',
    'Transcript:',
    transcript,
  ].filter(Boolean).join('\n')
}

const callOpenRouter = async (apiKey: string, prompt: string) => {
  const response = await $fetch<{
    choices?: Array<{ message?: { content?: string } }>
  }>('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: {
      model: 'openai/gpt-4.1-mini',
      temperature: 0.2,
      response_format: {
        type: 'json_object',
      },
      messages: [
        {
          role: 'system',
          content: 'You summarize transcripts. Return valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    },
  })

  return response.choices?.[0]?.message?.content?.trim() ?? ''
}

const callOpenAI = async (apiKey: string, prompt: string) => {
  const response = await $fetch<{
    choices?: Array<{ message?: { content?: string } }>
  }>('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: {
      model: 'gpt-4.1-mini',
      temperature: 0.2,
      response_format: {
        type: 'json_object',
      },
      messages: [
        {
          role: 'system',
          content: 'You summarize transcripts. Return valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    },
  })

  return response.choices?.[0]?.message?.content?.trim() ?? ''
}

const callAnthropic = async (apiKey: string, prompt: string) => {
  const response = await $fetch<{
    content?: Array<{ type?: string, text?: string }>
  }>('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: {
      model: 'claude-sonnet-4-5',
      temperature: 0.2,
      max_tokens: 900,
      system: 'You summarize transcripts. Return strict JSON only.',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    },
  })

  return response.content?.find(item => item.type === 'text')?.text?.trim() ?? ''
}

export default defineEventHandler(async (event) => {
  const body = (await readBody<SummaryRequest>(event)) ?? {}
  const transcript = typeof body.transcript === 'string' ? body.transcript.trim() : ''

  if (!transcript) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Transcript is required to generate a summary.',
    })
  }

  const config = useRuntimeConfig(event)
  const openrouterKey = config.openrouterApiKey || process.env.OPENROUTER_API_KEY || process.env.NUXT_OPENROUTER_API_KEY || ''
  const openaiKey = config.openaiApiKey || process.env.OPENAI_API_KEY || process.env.NUXT_OPENAI_API_KEY || ''
  const anthropicKey = config.anthropicApiKey || process.env.ANTHROPIC_API_KEY || process.env.NUXT_ANTHROPIC_API_KEY || ''
  const prompt = buildPrompt(transcript, body.sourceUrl, body.transcriber)

  const attempts: Array<{ provider: AiProvider, run: () => Promise<string> }> = []

  if (openrouterKey) {
    attempts.push({
      provider: 'openrouter',
      run: () => callOpenRouter(openrouterKey, prompt),
    })
  }

  if (openaiKey) {
    attempts.push({
      provider: 'openai',
      run: () => callOpenAI(openaiKey, prompt),
    })
  }

  if (anthropicKey) {
    attempts.push({
      provider: 'claude',
      run: () => callAnthropic(anthropicKey, prompt),
    })
  }

  if (!attempts.length) {
    throw createError({
      statusCode: 500,
      statusMessage: 'No AI provider is configured for transcript summaries.',
    })
  }

  let lastError: unknown = null

  for (const attempt of attempts) {
    try {
      const content = await attempt.run()
      if (!content) {
        throw new Error(`${attempt.provider} returned an empty summary response.`)
      }

      const parsed = normalizeJsonFromText(content)
      const normalized = normalizeSummaryPayload(parsed)

      if (!normalized) {
        throw new Error(`${attempt.provider} returned an invalid summary shape.`)
      }

      return normalized
    }
    catch (error) {
      lastError = error
    }
  }

  throw createError({
    statusCode: 500,
    statusMessage: lastError instanceof Error
      ? lastError.message
      : 'Unable to generate transcript summary right now.',
  })
})
