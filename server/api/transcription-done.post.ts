import { getVideoToTextJob, setVideoToTextJob } from '../utils/video-to-text-jobs'
import { extractTranscriptFromPayload } from '../utils/video-to-text-payload'

type VideoToTextCallbackPayload = {
  jobId?: string
  job_id?: string
  success?: boolean
  transcription?: string
  transcript?: string
  text?: string
  source_url?: string
  source?: string
  transcriber?: string
  word_count?: number
  timestamp?: string
  error?: string
  message?: string
  output?: Record<string, unknown>
  data?: Record<string, unknown>
  segments?: Array<{ text?: string }>
  utterances?: Array<{ text?: string }>
}

export default defineEventHandler(async (event) => {
  const queryJobId = getQuery(event).jobId
  const body = await readBody<VideoToTextCallbackPayload>(event)
  const jobId = typeof queryJobId === 'string' && queryJobId
    ? queryJobId
    : body?.jobId || body?.job_id

  if (typeof jobId !== 'string' || !jobId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A job id is required in the query string or callback body.',
    })
  }

  const success = body?.success !== false
  const existingJob = await getVideoToTextJob(jobId, event)
  const now = body?.timestamp || new Date().toISOString()
  const transcript = extractTranscriptFromPayload(body)
  const baseJob = existingJob ?? {
    id: jobId,
    status: 'processing' as const,
    sourceUrl: body?.source_url || '',
    source: body?.source || 'unknown',
    transcriber: body?.transcriber || 'assemblyai',
    createdAt: now,
    updatedAt: now,
  }

  await setVideoToTextJob({
    ...baseJob,
    status: success ? 'completed' : 'failed',
    sourceUrl: body?.source_url || baseJob.sourceUrl,
    source: body?.source || baseJob.source,
    transcriber: body?.transcriber || baseJob.transcriber,
    transcription: transcript || baseJob.transcription,
    wordCount: body?.word_count,
    error: success ? undefined : body?.error || body?.message || 'Transcription failed.',
    updatedAt: now,
  }, event)

  return {
    ok: true,
    message: 'Transcription callback stored.',
  }
})
