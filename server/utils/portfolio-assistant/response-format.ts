import type { PortfolioAssistantResponse } from './types'

type JsonResponseShape = {
  answer?: unknown
  sections?: unknown
}

const stripCodeFences = (content: string) => {
  const trimmed = content.trim()
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)

  if (fenceMatch?.[1]) {
    return fenceMatch[1].trim()
  }

  return trimmed
}

const extractJsonCandidate = (content: string) => {
  const cleaned = stripCodeFences(content)

  if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
    return cleaned
  }

  const startIndex = cleaned.indexOf('{')
  const endIndex = cleaned.lastIndexOf('}')

  if (startIndex >= 0 && endIndex > startIndex) {
    return cleaned.slice(startIndex, endIndex + 1)
  }

  return cleaned
}

export const normalizeAssistantText = (content: string) => {
  const cleaned = stripCodeFences(content)

  try {
    const parsed = JSON.parse(extractJsonCandidate(cleaned)) as JsonResponseShape
    if (typeof parsed.answer === 'string') {
      return {
        answer: stripCodeFences(parsed.answer).trim(),
        sections: Array.isArray(parsed.sections) ? parsed.sections as PortfolioAssistantResponse['sections'] : [],
      }
    }
  }
  catch {
    // fall through to plain text response
  }

  return {
    answer: cleaned,
    sections: [],
  }
}

export const normalizeAssistantResponse = (response: PortfolioAssistantResponse): PortfolioAssistantResponse => {
  const parsed = normalizeAssistantText(response.answer)

  return {
    answer: parsed.answer,
    sections: response.sections.length ? response.sections : parsed.sections,
  }
}
