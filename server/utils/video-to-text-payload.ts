type TranscriptSegment = {
  text?: string
}

type TranscriptPayload = Record<string, unknown> & {
  transcription?: string
  transcript?: string
  text?: string
  output?: {
    transcription?: string
    transcript?: string
    text?: string
    segments?: TranscriptSegment[]
    utterances?: TranscriptSegment[]
  }
  data?: {
    transcription?: string
    transcript?: string
    text?: string
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
