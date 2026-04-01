import { getVideoToTextJob, setVideoToTextJob } from '../../../../utils/video-to-text-jobs'

type VideoToTextCallbackPayload = {
  success?: boolean
  transcription?: string
  source_url?: string
  source?: string
  transcriber?: string
  word_count?: number
  timestamp?: string
  error?: string
  message?: string
}

export default defineEventHandler(async (event) => {
  const jobId = getRouterParam(event, 'jobId')

  if (!jobId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A job id is required.',
    })
  }

  const body = await readBody<VideoToTextCallbackPayload>(event)
  const success = body?.success !== false
  const existingJob = await getVideoToTextJob(jobId, event)
  const now = body?.timestamp || new Date().toISOString()
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
    transcription: body?.transcription || baseJob.transcription,
    wordCount: body?.word_count,
    error: success ? undefined : body?.error || body?.message || 'Transcription failed.',
    updatedAt: now,
  }, event)

  return {
    ok: true,
    message: 'Transcription callback stored.',
  }
})
