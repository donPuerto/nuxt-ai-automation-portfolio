import { getVideoToTextJob, setVideoToTextJob } from '../utils/video-to-text-jobs'

type VideoToTextCallbackPayload = {
  jobId?: string
  job_id?: string
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

  const existingJob = await getVideoToTextJob(jobId)

  if (!existingJob) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Transcription job not found.',
    })
  }

  const success = body?.success !== false

  await setVideoToTextJob({
    ...existingJob,
    status: success ? 'completed' : 'failed',
    sourceUrl: body?.source_url || existingJob.sourceUrl,
    source: body?.source || existingJob.source,
    transcriber: body?.transcriber || existingJob.transcriber,
    transcription: body?.transcription || existingJob.transcription,
    wordCount: body?.word_count,
    error: success ? undefined : body?.error || body?.message || 'Transcription failed.',
    updatedAt: body?.timestamp || new Date().toISOString(),
  })

  return {
    ok: true,
    message: 'Transcription callback stored.',
  }
})
