import { getSupabaseAdmin } from '../../../utils/supabase-admin'
import { requireSupabaseUser } from '../../../utils/knowledge-auth'
import {
  extractHighlightsFromPayload,
  extractSummaryFromPayload,
  extractTranscriptFromPayload,
} from '../../../utils/video-to-text-payload'
import { mapHighlights, transcriptionFileSelect, type TranscriptionFileRow } from '../../../utils/video-to-text-file-records'

type VideoToTextJobStatus = 'processing' | 'completed' | 'failed' | 'cancelled'

type VideoToTextJob = {
  id: string
  status: VideoToTextJobStatus
  transcription?: string
  summary?: string
  highlights?: string[]
  error?: string
}

type VideoToTextStatusResult = {
  ok?: boolean
  job?: VideoToTextJob
}

type TranscriptionRunRow = {
  status: VideoToTextJobStatus
  error_message: string | null
  result_payload: Record<string, unknown> | null
}

const isMissingTranscriptionFilesTableError = (error: { message?: string, code?: string } | null) => {
  if (!error) {
    return false
  }

  if (error.code === 'PGRST205') {
    return true
  }

  const message = error.message?.toLowerCase() ?? ''
  return message.includes('could not find the table')
    && message.includes('public.transcription_files')
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const getLastJobId = (metadata: Record<string, unknown> | null) => {
  const candidate = metadata?.last_job_id
  const normalizedCandidate = typeof candidate === 'string' ? candidate.trim() : ''
  return uuidPattern.test(normalizedCandidate) ? normalizedCandidate : ''
}

const reconcileTranscriptionFile = async (
  file: TranscriptionFileRow,
  event: Parameters<typeof defineEventHandler>[0],
) => {
  if (!['queued', 'processing'].includes(file.status)) {
    return file
  }

  const lastJobId = getLastJobId(file.metadata)
  if (!lastJobId) {
    return file
  }

  const supabase = getSupabaseAdmin(event)

  const { data: runRecord, error: runError } = await supabase
    .from('transcription_runs')
    .select('status,error_message,result_payload')
    .eq('job_id', lastJobId)
    .eq('transcription_file_id', file.id)
    .maybeSingle<TranscriptionRunRow>()

  if (!runError && runRecord && runRecord.status !== 'processing') {
    const transcript = extractTranscriptFromPayload((runRecord.result_payload ?? undefined) as Record<string, unknown> | undefined)
    const summary = extractSummaryFromPayload((runRecord.result_payload ?? undefined) as Record<string, unknown> | undefined)
    const highlights = extractHighlightsFromPayload((runRecord.result_payload ?? undefined) as Record<string, unknown> | undefined) ?? []

    const { data: updatedFile, error: updateError } = await supabase
      .from('transcription_files')
      .update({
        status: runRecord.status,
        transcription: transcript || file.transcription || null,
        summary: summary || file.summary || null,
        highlights: highlights.length ? highlights : file.highlights,
        error_message: runRecord.status === 'completed' ? null : runRecord.error_message || 'Transcription failed.',
      })
      .eq('id', file.id)
      .eq('user_id', file.user_id)
      .select(transcriptionFileSelect)
      .single()

    if (!updateError && updatedFile) {
      return updatedFile as TranscriptionFileRow
    }
  }

  const requestUrl = getRequestURL(event)
  const statusUrl = `${requestUrl.origin}/api/tools/video-to-text/status/${lastJobId}`

  try {
    const result = await $fetch<VideoToTextStatusResult>(statusUrl, {
      query: { t: Date.now() },
      headers: {
        cookie: getHeader(event, 'cookie') || '',
      },
    })

    if (!result.ok || !result.job || result.job.status === 'processing') {
      return file
    }

    const nextStatus = result.job.status
    const highlights = Array.isArray(result.job.highlights) ? result.job.highlights : []

    await supabase
      .from('transcription_runs')
      .update({
        status: nextStatus,
        finished_at: new Date().toISOString(),
        error_message: nextStatus === 'completed' ? null : result.job.error || 'Transcription failed.',
      })
      .eq('job_id', lastJobId)
      .eq('transcription_file_id', file.id)

    const { data: updatedFile, error: updateError } = await supabase
      .from('transcription_files')
      .update({
        status: nextStatus,
        transcription: result.job.transcription || file.transcription || null,
        summary: result.job.summary || file.summary || null,
        highlights,
        error_message: nextStatus === 'completed' ? null : result.job.error || 'Transcription failed.',
      })
      .eq('id', file.id)
      .eq('user_id', file.user_id)
      .select(transcriptionFileSelect)
      .single()

    if (updateError || !updatedFile) {
      console.warn('transcription file reconcile failed', updateError)
      return file
    }

    return updatedFile as TranscriptionFileRow
  }
  catch (error) {
    console.warn('transcription file reconcile skipped', error)
    return file
  }
}

export default defineEventHandler(async (event) => {
  setResponseHeaders(event, {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  })

  const user = await requireSupabaseUser(event)
  const supabase = getSupabaseAdmin(event)

  const { data, error } = await supabase
    .from('transcription_files')
    .select(transcriptionFileSelect)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    if (isMissingTranscriptionFilesTableError(error)) {
      console.warn('transcription_files table is missing; returning empty uploaded-files list')
      return {
        files: [],
      }
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  const reconciledFiles = await Promise.all(
    ((data ?? []) as TranscriptionFileRow[]).map(file => reconcileTranscriptionFile(file, event)),
  )

  const files = reconciledFiles.map(file => ({
    ...file,
    highlights: mapHighlights(file.highlights),
  }))

  return { files }
})
