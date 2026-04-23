type TranscriptSegment = {
  text?: string
}

type TranscriptPayload = Record<string, unknown> & {
  transcription?: string
  transcript?: string
  text?: string
  summary?: string
  highlights?: string[]
  output?: {
    transcription?: string
    transcript?: string
    text?: string
    summary?: string
    highlights?: string[]
    segments?: TranscriptSegment[]
    utterances?: TranscriptSegment[]
  }
  data?: {
    transcription?: string
    transcript?: string
    text?: string
    summary?: string
    highlights?: string[]
    segments?: TranscriptSegment[]
    utterances?: TranscriptSegment[]
  }
  segments?: TranscriptSegment[]
  utterances?: TranscriptSegment[]
}

const joinSegments = (segments?: TranscriptSegment[]) => {
  const text = segments
    ?.map(segment => typeof segment?.text === 'string' ? segment.text.trim() : '')
    .filter(Boolean)
    .join(' ')
    .trim()

  return text || undefined
}

export const extractTranscriptFromPayload = (payload?: TranscriptPayload) => {
  if (!payload) {
    return undefined
  }

  return payload.transcription
    || payload.transcript
    || payload.text
    || payload.output?.transcription
    || payload.output?.transcript
    || payload.output?.text
    || payload.data?.transcription
    || payload.data?.transcript
    || payload.data?.text
    || joinSegments(payload.segments)
    || joinSegments(payload.utterances)
    || joinSegments(payload.output?.segments)
    || joinSegments(payload.output?.utterances)
    || joinSegments(payload.data?.segments)
    || joinSegments(payload.data?.utterances)
}

export const extractSummaryFromPayload = (payload?: TranscriptPayload) => {
  if (!payload) {
    return undefined
  }

  const summary = payload.summary
    || payload.output?.summary
    || payload.data?.summary

  if (typeof summary !== 'string') {
    return undefined
  }

  const normalizedSummary = summary.trim()
  return normalizedSummary || undefined
}

export const extractHighlightsFromPayload = (payload?: TranscriptPayload) => {
  if (!payload) {
    return undefined
  }

  const highlightsCandidate = payload.highlights
    || payload.output?.highlights
    || payload.data?.highlights

  if (!Array.isArray(highlightsCandidate)) {
    return undefined
  }

  const highlights = highlightsCandidate
    .map(item => typeof item === 'string' ? item.trim() : '')
    .filter(Boolean)

  return highlights.length ? highlights : undefined
}
