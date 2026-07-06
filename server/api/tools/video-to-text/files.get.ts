import type { H3Event } from 'h3'
import { getSupabaseAdmin } from '../../../utils/supabase-admin'
import { requireSupabaseUser } from '../../../utils/knowledge-auth'
import {
  createSignedTranscriptionMediaUrl,
  getSignedTranscriptionMediaUrlTtl,
  getTranscriptionStorageMeta,
} from '../../../utils/transcription-storage'
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
const PROCESSING_TIMEOUT_MS = 15 * 60 * 1000

const getCurrentJobId = (file: Pick<TranscriptionFileRow, 'current_job_id'>) => {
  const normalizedCandidate = typeof file.current_job_id === 'string' ? file.current_job_id.trim() : ''
  return uuidPattern.test(normalizedCandidate) ? normalizedCandidate : ''
}

const isProcessingTimedOut = (file: Pick<TranscriptionFileRow, 'started_at' | 'created_at' | 'status'>) => {
  if (!['queued', 'processing'].includes(file.status)) {
    return false
  }

  const startedAtRaw = file.started_at || file.created_at
  if (!startedAtRaw) {
    return false
  }

  const startedAt = new Date(startedAtRaw).getTime()
  if (Number.isNaN(startedAt)) {
    return false
  }

  return Date.now() - startedAt > PROCESSING_TIMEOUT_MS
}

const withSignedStorageUrl = async (
  file: TranscriptionFileRow,
  event: H3Event,
) => {
  const storageMeta = getTranscriptionStorageMeta(file.metadata)
  if (!storageMeta.bucket || !storageMeta.path) {
    return file
  }

  try {
    const supabase = getSupabaseAdmin(event)
    const signedUrl = await createSignedTranscriptionMediaUrl({
      supabase,
      bucket: storageMeta.bucket,
      path: storageMeta.path,
      expiresIn: getSignedTranscriptionMediaUrlTtl(),
    })

    if (!signedUrl) {
      return file
    }

    return {
      ...file,
      source_url: signedUrl,
    }
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`transcription file signed url refresh skipped: ${message}`)
    return file
  }
}

const reconcileTranscriptionFile = async (
  file: TranscriptionFileRow,
  event: H3Event,
) => {
  if (!['queued', 'processing'].includes(file.status)) {
    return file
  }

  const currentJobId = getCurrentJobId(file)
  if (!currentJobId) {
    return file
  }

  const requestUrl = getRequestURL(event)
  const statusUrl = `${requestUrl.origin}/api/tools/video-to-text/status/${currentJobId}`

  try {
    const result = await $fetch<VideoToTextStatusResult>(statusUrl, {
      query: { t: Date.now() },
      headers: {
        cookie: getHeader(event, 'cookie') || '',
      },
    })

    if (!result.ok || !result.job) {
      return file
    }

    if (result.job.status === 'processing') {
      if (!isProcessingTimedOut(file)) {
        return file
      }

      const supabase = getSupabaseAdmin(event)
      const { data: timedOutFile, error: timedOutError } = await supabase
        .from('transcription_files')
        .update({
          status: 'failed',
          error_message: 'Transcription timed out while waiting for n8n callback. Please retry.',
          finished_at: new Date().toISOString(),
        })
        .eq('id', file.id)
        .eq('user_id', file.user_id)
        .select(transcriptionFileSelect)
        .single()

      if (timedOutError || !timedOutFile) {
        console.warn('transcription file timeout reconcile failed', timedOutError)
        return file
      }

      return timedOutFile as TranscriptionFileRow
    }

    const nextStatus = result.job.status
    const highlights = Array.isArray(result.job.highlights) ? result.job.highlights : []
    const supabase = getSupabaseAdmin(event)

    const { data: updatedFile, error: updateError } = await supabase
      .from('transcription_files')
      .update({
        status: nextStatus,
        transcription: result.job.transcription || file.transcription || null,
        summary: result.job.summary || file.summary || null,
        highlights,
        error_message: nextStatus === 'completed' ? null : result.job.error || 'Transcription failed.',
        finished_at: new Date().toISOString(),
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
    if (isProcessingTimedOut(file)) {
      try {
        const supabase = getSupabaseAdmin(event)
        const { data: timedOutFile, error: timedOutError } = await supabase
          .from('transcription_files')
          .update({
            status: 'failed',
            error_message: 'Transcription timed out while waiting for n8n callback. Please retry.',
            finished_at: new Date().toISOString(),
          })
          .eq('id', file.id)
          .eq('user_id', file.user_id)
          .select(transcriptionFileSelect)
          .single()

        if (!timedOutError && timedOutFile) {
          return timedOutFile as TranscriptionFileRow
        }
      }
      catch (timeoutError) {
        console.warn('transcription timeout fallback failed', timeoutError)
      }
    }

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
  const hydratedFiles = await Promise.all(
    reconciledFiles.map(file => withSignedStorageUrl(file, event)),
  )

  const files = hydratedFiles.map(file => ({
    ...file,
    highlights: mapHighlights(file.highlights),
  }))

  return { files }
})
