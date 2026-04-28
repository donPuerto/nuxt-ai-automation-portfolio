import type { H3Event } from 'h3'
import { getSupabaseAdmin } from '../supabase-admin'
import { buildKnowledgeSummary, replaceDocumentChunks } from '../knowledge-indexing'

type SelfLearnParams = {
  prompt: string
  answer: string
  config: ReturnType<typeof useRuntimeConfig>
  event: H3Event
}

type ExtractionDecision = {
  extract: boolean
  reason?: string
}

type ExtractedKnowledge = {
  title: string
  content: string
}

const SELF_LEARN_SOURCE = 'conversation-learning'
const DEDUP_WINDOW_HOURS = 48
const MIN_ANSWER_LENGTH = 80
const MIN_PROMPT_LENGTH = 10

// Use the cheapest available model for extraction to keep costs minimal
const callExtractionModel = async (
  systemPrompt: string,
  userMessage: string,
  config: ReturnType<typeof useRuntimeConfig>,
): Promise<string | null> => {
  const openaiKey = config.openaiApiKey || process.env.OPENAI_API_KEY || process.env.NUXT_OPENAI_API_KEY
  if (openaiKey) {
    try {
      const response = await $fetch<{ choices?: Array<{ message?: { content?: string } }> }>(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
          body: {
            model: 'gpt-4.1-nano',
            temperature: 0.2,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage },
            ],
          },
        },
      )
      return response.choices?.[0]?.message?.content ?? null
    }
    catch { /* fall through to next provider */ }
  }

  const anthropicKey = config.anthropicApiKey || process.env.ANTHROPIC_API_KEY || process.env.NUXT_ANTHROPIC_API_KEY
  if (anthropicKey) {
    try {
      const response = await $fetch<{ content?: Array<{ type: string, text: string }> }>(
        'https://api.anthropic.com/v1/messages',
        {
          method: 'POST',
          headers: {
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: {
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 700,
            temperature: 0.2,
            system: systemPrompt,
            messages: [{ role: 'user', content: userMessage }],
          },
        },
      )
      return response.content?.find(c => c.type === 'text')?.text ?? null
    }
    catch { /* fall through */ }
  }

  return null
}

const evaluateConversation = async (
  prompt: string,
  answer: string,
  config: ReturnType<typeof useRuntimeConfig>,
): Promise<boolean> => {
  const systemPrompt = [
    'You evaluate portfolio chatbot conversations to decide if they reveal extractable knowledge.',
    '',
    'Extract ONLY when the Q&A reveals specific, factual, reusable knowledge about Don Puerto:',
    '- Technical skills, tools, or frameworks he uses or has experience with',
    '- Projects he built, contributed to, or is working on',
    '- Work experience, clients, industries, or professional background',
    '- Rates, availability, service offerings, or how to hire him',
    '- Professional methodology, philosophy, or approach to work',
    '- Specific technical capabilities or opinions',
    '',
    'Do NOT extract:',
    '- Greetings, small talk, or vague conversational turns',
    '- Answers that say "I don\'t have that" or "not in knowledge base"',
    '- Questions answered with fewer than 3 substantive sentences',
    '- Meta-questions about the AI, chatbot, or the system itself',
    '- Information that is almost certainly already a well-known basic fact',
    '',
    'Respond with valid JSON only: {"extract": boolean, "reason": string}',
  ].join('\n')

  const userMessage = `USER QUESTION:\n${prompt}\n\nASSISTANT ANSWER:\n${answer}`

  try {
    const raw = await callExtractionModel(systemPrompt, userMessage, config)
    if (!raw) return false
    const parsed = JSON.parse(raw) as ExtractionDecision
    return parsed.extract === true
  }
  catch {
    return false
  }
}

const extractKnowledge = async (
  prompt: string,
  answer: string,
  config: ReturnType<typeof useRuntimeConfig>,
): Promise<ExtractedKnowledge | null> => {
  const systemPrompt = [
    'Convert a portfolio chatbot Q&A into a clean, factual knowledge entry.',
    'Write 1–3 paragraphs in third-person, factual style about Don Puerto.',
    'Be specific and concrete. Do not restate the question. Do not use a Q&A format.',
    'The content should stand alone and be useful for answering similar questions in the future.',
    '',
    'Respond with valid JSON only: {"title": "5–10 word knowledge title", "content": "knowledge paragraphs here"}',
  ].join('\n')

  const userMessage = `USER QUESTION:\n${prompt}\n\nASSISTANT ANSWER:\n${answer}`

  try {
    const raw = await callExtractionModel(systemPrompt, userMessage, config)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { title?: unknown, content?: unknown }
    if (typeof parsed.title !== 'string' || typeof parsed.content !== 'string') return null
    if (!parsed.title.trim() || !parsed.content.trim()) return null
    return { title: parsed.title.trim(), content: parsed.content.trim() }
  }
  catch {
    return null
  }
}

const isRecentDuplicate = async (
  supabase: ReturnType<typeof getSupabaseAdmin>,
  title: string,
): Promise<boolean> => {
  const cutoff = new Date(Date.now() - DEDUP_WINDOW_HOURS * 60 * 60 * 1000).toISOString()

  const { data } = await supabase
    .from('documents')
    .select('id')
    .eq('source', SELF_LEARN_SOURCE)
    .ilike('name', title)
    .gte('created_at', cutoff)
    .limit(1)

  return (data?.length ?? 0) > 0
}

export const selfLearnFromConversation = async ({
  prompt,
  answer,
  config,
  event,
}: SelfLearnParams): Promise<void> => {
  if (!config.selfLearnEnabled) return
  if (prompt.trim().length < MIN_PROMPT_LENGTH) return
  if (answer.trim().length < MIN_ANSWER_LENGTH) return

  const shouldExtract = await evaluateConversation(prompt, answer, config)
  if (!shouldExtract) return

  const extracted = await extractKnowledge(prompt, answer, config)
  if (!extracted) return

  const supabase = getSupabaseAdmin(event)
  const duplicate = await isRecentDuplicate(supabase, extracted.title)
  if (duplicate) return

  const documentId = crypto.randomUUID()

  const { error: insertError } = await supabase.from('documents').insert({
    id: documentId,
    name: extracted.title,
    source: SELF_LEARN_SOURCE,
    source_type: 'text',
    file_type: 'text',
    summary: buildKnowledgeSummary(extracted.content),
    status: 'indexed',
  })

  if (insertError) {
    console.warn('[self-learn] failed to insert document', insertError.message)
    return
  }

  try {
    await replaceDocumentChunks({
      supabase,
      documentId,
      content: extracted.content,
      sourceType: 'text',
      options: { openaiApiKey: config.openaiApiKey },
    })
    console.log('[self-learn] indexed new knowledge:', extracted.title)
  }
  catch (err) {
    console.warn('[self-learn] chunk embedding failed', err)
    await supabase.from('documents').update({ status: 'failed' }).eq('id', documentId)
  }
}
