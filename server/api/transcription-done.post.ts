import { getVideoToTextJob, setVideoToTextJob } from '../utils/video-to-text-jobs'
import { getSupabaseAdmin, hasSupabaseAdminConfig } from '../utils/supabase-admin'
import {
  extractHighlightsFromPayload,
  extractSummaryFromPayload,
  extractTranscriptFromPayload,
} from '../utils/video-to-text-payload'

type VideoToTextCallbackPayload = {
  jobId?: string
  job_id?: string
  success?: boolean
  transcription?: string
  transcript?: string
  text?: string
  summary?: string
  highlights?: string[]
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
  const summary = extractSummaryFromPayload(body)
  const highlights = extractHighlightsFromPayload(body)
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
    summary: summary || baseJob.summary,
    highlights: highlights || baseJob.highlights,
    wordCount: body?.word_count,
    error: success ? undefined : body?.error || body?.message || 'Transcription failed.',
    updatedAt: now,
  }, event)

  if (hasSupabaseAdminConfig(event)) {
    try {
      const supabase = getSupabaseAdmin(event)
      const nextStatus = success ? 'completed' : 'failed'
      await supabase
        .from('transcription_files')
        .update({
          status: nextStatus,
          transcriber: body?.transcriber || baseJob.transcriber,
          transcription: transcript || baseJob.transcription || null,
          summary: summary || null,
          highlights: highlights ?? [],
          error_message: success ? null : body?.error || body?.message || 'Transcription failed.',
          finished_at: now,
          result_payload: body as Record<string, unknown>,
        })
        .eq('current_job_id', jobId)
    }
    catch (dbError) {
      console.warn('transcription-done db sync failed', dbError)
    }
  }

  return {
    ok: true,
    message: 'Transcription callback stored.',
  }
})
