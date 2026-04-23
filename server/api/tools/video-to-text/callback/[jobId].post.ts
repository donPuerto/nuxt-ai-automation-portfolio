import { getVideoToTextJob, setVideoToTextJob } from '../../../../utils/video-to-text-jobs'
import { getSupabaseAdmin, hasSupabaseAdminConfig } from '../../../../utils/supabase-admin'
import {
  extractHighlightsFromPayload,
  extractSummaryFromPayload,
  extractTranscriptFromPayload,
} from '../../../../utils/video-to-text-payload'

type VideoToTextCallbackPayload = {
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
      const runStatus = success ? 'completed' : 'failed'
      const { data: runRecord } = await supabase
        .from('transcription_runs')
        .update({
          status: runStatus,
          error_message: success ? null : body?.error || body?.message || 'Transcription failed.',
          finished_at: now,
          result_payload: body as Record<string, unknown>,
        })
        .eq('job_id', jobId)
        .select('transcription_file_id')
        .maybeSingle()

      if (runRecord?.transcription_file_id) {
        await supabase
          .from('transcription_files')
          .update({
            status: runStatus,
            transcriber: body?.transcriber || baseJob.transcriber,
            transcription: transcript || baseJob.transcription || null,
            summary: summary || null,
            highlights: highlights ?? [],
            error_message: success ? null : body?.error || body?.message || 'Transcription failed.',
          })
          .eq('id', runRecord.transcription_file_id)
      }
    }
    catch (dbError) {
      console.warn('video-to-text callback db sync failed', dbError)
    }
  }

  return {
    ok: true,
    message: 'Transcription callback stored.',
  }
})
