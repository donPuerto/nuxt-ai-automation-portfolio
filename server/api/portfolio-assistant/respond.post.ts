import type { PortfolioAssistantResponse, PortfolioAssistantRequest } from '../../utils/portfolio-assistant/types'
import { aboutKnowledge } from '@@/shared'
import { getSupabaseAdmin } from '../../utils/supabase-admin'
import { generatePortfolioAiResponse } from '../../utils/portfolio-assistant/generate-ai-response'
import { normalizeAssistantResponse } from '../../utils/portfolio-assistant/response-format'

type AssistantApiResult = {
  ok?: boolean
  message?: string
  response?: PortfolioAssistantResponse
  answer?: string
  sections?: PortfolioAssistantResponse['sections']
  data?: {
    answer?: string
    sections?: PortfolioAssistantResponse['sections']
    response?: PortfolioAssistantResponse
  }
}

const toMessage = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: { message?: string } }).data
    if (data?.message) {
      return data.message
    }
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: string }).message
    if (message) {
      return message
    }
  }

  return ''
}

const normalizeResponse = (payload: AssistantApiResult): PortfolioAssistantResponse | null => {
  if (payload.response?.answer && Array.isArray(payload.response.sections)) {
    return normalizeAssistantResponse(payload.response)
  }

  if (payload.data?.response?.answer && Array.isArray(payload.data.response.sections)) {
    return normalizeAssistantResponse(payload.data.response)
  }

  if (payload.answer && Array.isArray(payload.sections)) {
    return normalizeAssistantResponse({
      answer: payload.answer,
      sections: payload.sections,
    })
  }

  if (payload.data?.answer && Array.isArray(payload.data.sections)) {
    return normalizeAssistantResponse({
      answer: payload.data.answer,
      sections: payload.data.sections,
    })
  }

  return null
}

const tryGenerateDirectAiResponse = async (
  config: ReturnType<typeof useRuntimeConfig>,
  body: PortfolioAssistantRequest,
) => {
  try {
    return await generatePortfolioAiResponse({
      config,
      prompt: body.prompt ?? '',
      agentId: body.agentId,
    })
  }
  catch (error) {
    console.error('direct portfolio AI generation failed', error)
    return null
  }
}

const isEmptyKnowledgeReply = (response: PortfolioAssistantResponse | null) => {
  const answer = response?.answer?.trim().toLowerCase() ?? ''

  if (!answer) {
    return false
  }

  return [
    'there is no indexed knowledge available',
    'there is currently no indexed knowledge available',
    'no indexed knowledge available',
    'please upload a file',
    'add text to the knowledge base first',
    'upload a file or add text',
    'knowledge base first',
  ].some(fragment => answer.includes(fragment))
}

const buildPortfolioContext = () => {
  return {
    role: aboutKnowledge.role,
    shortBio: aboutKnowledge.shortBio,
    intro: aboutKnowledge.firstPersonIntro,
    background: aboutKnowledge.background,
    whatIDo: aboutKnowledge.whatIDo,
    education: aboutKnowledge.education,
    workExperience: aboutKnowledge.workExperience,
    trainings: aboutKnowledge.trainings,
    techStack: aboutKnowledge.techStack,
    differentiators: aboutKnowledge.differentiators,
    availability: aboutKnowledge.availability,
    contact: aboutKnowledge.contact,
    responseRules: [
      'Answer naturally as Don Puerto in a conversational first-person tone.',
      'Use only the profile context below and the indexed knowledge context above.',
      'Do not use outside facts, assumptions, or general model memory.',
      'For greetings, respond briefly and warmly. Do not overshare unless the user asks.',
      'When the user asks about education, school, resume, or work experience, use the profile context first before saying information is missing.',
      'If the answer is not in the provided context, say that you do not have that in the knowledge base yet.',
      'Only mention the knowledge base or uploads when the user is explicitly asking about documents, indexing, or missing source material.',
    ],
  }
}

const buildKnowledgeContext = async (event: Parameters<typeof getSupabaseAdmin>[0]) => {
  try {
    const supabase = getSupabaseAdmin(event)
    const [{ data: documents, error: documentsError }, { count: chunksCount, error: chunksError }] = await Promise.all([
      supabase
        .from('documents')
        .select('id,name,status,source_type,file_name,updated_at')
        .order('updated_at', { ascending: false })
        .limit(10),
      supabase
        .from('document_chunks')
        .select('id', { count: 'exact', head: true }),
    ])

    if (documentsError || chunksError) {
      return {
        available: false,
        indexedDocumentCount: 0,
        chunkCount: 0,
        indexedDocuments: [],
      }
    }

    const indexedDocuments = (documents ?? [])
      .filter(document => document.status === 'indexed')
      .map(document => ({
        id: document.id,
        name: document.name || document.file_name || 'Untitled document',
        sourceType: document.source_type,
        updatedAt: document.updated_at,
      }))

    return {
      available: indexedDocuments.length > 0 || (chunksCount ?? 0) > 0,
      indexedDocumentCount: indexedDocuments.length,
      chunkCount: chunksCount ?? 0,
      indexedDocuments,
    }
  }
  catch {
    return {
      available: false,
      indexedDocumentCount: 0,
      chunkCount: 0,
      indexedDocuments: [],
    }
  }
}

export default defineEventHandler(async (event) => {
  const body = (await readBody<PortfolioAssistantRequest>(event)) ?? {}
  const config = useRuntimeConfig(event)

  const knowledgeContext = await buildKnowledgeContext(event)

  if (!config.n8nAskDonWebhookUrl) {
    const directResponse = await tryGenerateDirectAiResponse(config, body)

    if (!directResponse) {
      return {
        ok: false,
        message: 'The portfolio assistant is not available right now because no AI workflow or direct AI provider is ready.',
      }
    }

    return {
      ok: true,
      message: 'n8n Ask Don webhook is not configured. Generated response directly from AI provider.',
      response: directResponse,
      provider: 'direct-ai',
    }
  }

  try {
    const upstream = await $fetch.raw<AssistantApiResult>(config.n8nAskDonWebhookUrl, {
      method: 'POST',
      ignoreResponseError: true,
      headers: config.n8nAskDonWebhookToken
        ? {
            Authorization: `Bearer ${config.n8nAskDonWebhookToken}`,
          }
        : undefined,
      body: {
        source: 'ai-portfolio-prompt',
        prompt: body.prompt ?? '',
        intent: body.intent ?? 'prompt',
        categoryId: body.categoryId ?? null,
        agentId: body.agentId ?? null,
        attachments: body.attachments ?? [],
        portfolioContext: buildPortfolioContext(),
        knowledgeContext,
        systemPrompt: [
          'You are Don Puerto AI Assistant.',
          'Answer naturally, warmly, and concisely.',
          'Use only portfolioContext and knowledgeContext as your sources.',
          'Do not use outside facts, assumptions, or general model memory.',
          'Use knowledgeContext as live proof of what is already indexed in the knowledge base.',
          'If knowledgeContext.available is true, do not say there is no indexed knowledge available.',
          'If the user asks about age, birthday, or birth year and it is not explicitly listed in portfolioContext or knowledgeContext, do not guess, estimate, or infer it from graduation years or other hints.',
          'If the exact age is not recorded in the provided context, say that it is not recorded in the knowledge base.',
          'If the answer is not present in the provided context, say that you do not have that in the knowledge base yet.',
          'For greetings, answer briefly and do not overshare.',
          'Return JSON with shape {"answer":"string","sections":[]}.',
        ].join('\n'),
        path: getHeader(event, 'referer') ?? '/',
        triggeredAt: new Date().toISOString(),
        userAgent: getHeader(event, 'user-agent') ?? '',
      },
    })

    if (!upstream.ok) {
      const upstreamError = typeof upstream._data?.message === 'string'
        ? upstream._data.message
        : `Ask Don webhook returned ${upstream.status}.`
      const directResponse = await tryGenerateDirectAiResponse(config, body)

      if (!directResponse) {
        return {
          ok: false,
          message: upstreamError || 'The portfolio assistant is not available right now.',
        }
      }

      return {
        ok: true,
        message: upstreamError,
        response: directResponse,
        provider: 'direct-ai',
      }
    }

    const normalized = normalizeResponse(upstream._data ?? {})
    if (!normalized) {
      const directResponse = await tryGenerateDirectAiResponse(config, body)

      if (!directResponse) {
        return {
          ok: false,
          message: 'Ask Don webhook returned an invalid response shape and no direct AI provider could recover the request.',
        }
      }

      return {
        ok: true,
        message: 'Ask Don webhook returned an invalid response shape. Generated response directly from AI provider.',
        response: directResponse,
        provider: 'direct-ai',
      }
    }

    if (isEmptyKnowledgeReply(normalized)) {
      const directResponse = await tryGenerateDirectAiResponse(config, body)

      if (!directResponse) {
        return {
          ok: false,
          message: 'Ask Don webhook returned an empty knowledge response and no direct AI provider could recover the request.',
        }
      }

      return {
        ok: true,
        message: 'Ask Don webhook returned an empty knowledge response. Generated response directly from AI provider.',
        response: directResponse,
        provider: 'direct-ai',
      }
    }

    return {
      ok: true,
      message: upstream._data?.message || 'Portfolio assistant response ready.',
      response: normalized,
      provider: 'n8n',
    }
  }
  catch (error) {
    console.error('ask-don webhook failed', error)
    const directResponse = await tryGenerateDirectAiResponse(config, body)

    if (!directResponse) {
      return {
        ok: false,
        message: toMessage(error) || 'The portfolio assistant is not available right now.',
      }
    }

    return {
      ok: true,
      message: toMessage(error) || 'n8n Ask Don webhook request failed. Generated response directly from AI provider.',
      response: directResponse,
      provider: 'direct-ai',
    }
  }
})
