import { getSupabaseAdmin } from '../../../../../utils/supabase-admin'
import { requireSupabaseUser } from '../../../../../utils/knowledge-auth'
import { setVideoToTextJob } from '../../../../../utils/video-to-text-jobs'
import { mapHighlights, transcriptionFileSelect } from '../../../../../utils/video-to-text-file-records'

type StartFileTranscriptionBody = {
  transcriber?: 'assemblyai' | 'deepgram' | 'whisper'
}

const isPublicOrigin = (origin: string) => {
  try {
    const { hostname } = new URL(origin)
    return !['localhost', '127.0.0.1', '0.0.0.0'].includes(hostname)
  }
  catch {
    return false
  }
}

const buildConfiguredCallbackUrl = (callbackBaseUrl: string, jobId: string) => {
  try {
    const url = new URL(callbackBaseUrl)
    url.searchParams.set('jobId', jobId)
    return url.toString()
  }
  catch {
    return callbackBaseUrl
  }
}

export default defineEventHandler(async (event) => {
  const user = await requireSupabaseUser(event)
  const config = useRuntimeConfig(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody<StartFileTranscriptionBody>(event)
  const transcriber = body?.transcriber && ['assemblyai', 'deepgram', 'whisper'].includes(body.transcriber)
    ? body.transcriber
    : 'deepgram'

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'File id is required.',
    })
  }

  if (!config.videoToTextWebhookUrl || !config.videoToTextApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Video to text webhook configuration is missing.',
    })
  }

  const supabase = getSupabaseAdmin(event)
  const { data: file, error: fileError } = await supabase
    .from('transcription_files')
    .select(transcriptionFileSelect)
    .eq('id', id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (fileError || !file) {
    throw createError({
      statusCode: 404,
      statusMessage: fileError?.message || 'Transcription file not found.',
    })
  }

  if (!file.drive_file_id && !file.source_url) {
    throw createError({
      statusCode: 400,
      statusMessage: 'This file has no Google Drive reference yet. Upload it again first.',
    })
  }

  const requestOrigin = getRequestURL(event).origin
  const siteUrl = config.public.siteUrl?.trim() || requestOrigin
  const jobId = crypto.randomUUID()
  const configuredCallbackUrl = config.videoToTextCallbackUrl?.trim()
    ? buildConfiguredCallbackUrl(config.videoToTextCallbackUrl.trim(), jobId)
    : ''
  const fallbackCallbackUrl = isPublicOrigin(siteUrl)
    ? `${siteUrl.replace(/\/$/, '')}/api/tools/video-to-text/callback/${jobId}`
    : ''
  const callbackUrl = configuredCallbackUrl || fallbackCallbackUrl
  const callbackReachable = Boolean(callbackUrl)
  const now = new Date().toISOString()

  await setVideoToTextJob({
    id: jobId,
    status: 'processing',
    sourceUrl: file.source_url || file.file_name,
    source: 'gdrive',
    transcriber,
    createdAt: now,
    updatedAt: now,
  }, event)

  const { error: runInsertError } = await supabase
    .from('transcription_runs')
    .insert({
      transcription_file_id: file.id,
      user_id: user.id,
      job_id: jobId,
      callback_url: callbackUrl || null,
      transcriber,
      status: 'processing',
      source_url: file.source_url,
      started_at: now,
    })

  if (runInsertError) {
    throw createError({
      statusCode: 500,
      statusMessage: runInsertError.message,
    })
  }

  const response = await $fetch.raw<{ message?: string }>(config.videoToTextWebhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': config.videoToTextApiKey,
    },
    ignoreResponseError: true,
    body: {
      job_id: jobId,
      url: file.source_url || '',
      source: 'gdrive',
      transcriber,
      gdrive_file_id: file.drive_file_id || '',
      callback_url: callbackUrl,
    },
  })

  if (!response.ok) {
    const message
      = typeof response._data === 'object'
        && response._data !== null
        && 'message' in response._data
        && typeof response._data.message === 'string'
        ? response._data.message
        : `Video to text webhook returned ${response.status}.`

    await supabase
      .from('transcription_runs')
      .update({
        status: 'failed',
        error_message: message,
        finished_at: new Date().toISOString(),
      })
      .eq('job_id', jobId)
      .eq('user_id', user.id)

    await supabase
      .from('transcription_files')
      .update({
        status: 'failed',
        error_message: message,
      })
      .eq('id', file.id)
      .eq('user_id', user.id)

    throw createError({
      statusCode: 500,
      statusMessage: message,
    })
  }

  const { data: updatedFile } = await supabase
    .from('transcription_files')
    .update({
      status: 'processing',
      transcriber,
      error_message: null,
      metadata: {
        ...(file.metadata ?? {}),
        last_job_id: jobId,
      },
    })
    .eq('id', file.id)
    .eq('user_id', user.id)
    .select(transcriptionFileSelect)
    .single()

  return {
    ok: true,
    file: updatedFile
      ? {
          ...updatedFile,
          highlights: mapHighlights(updatedFile.highlights),
        }
      : null,
    jobId,
    callbackReachable,
    callbackUrl,
    message: callbackReachable
      ? 'Transcription started from uploaded file.'
      : 'Transcription started, but callback URL is not reachable yet.',
  }
})
