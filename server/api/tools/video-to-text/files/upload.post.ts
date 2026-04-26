import type { H3Event } from 'h3'
import { getSupabaseAdmin } from '../../../../utils/supabase-admin'
import { requireSupabaseUser } from '../../../../utils/knowledge-auth'
import { setVideoToTextJob } from '../../../../utils/video-to-text-jobs'
import { mapHighlights, transcriptionFileSelect } from '../../../../utils/video-to-text-file-records'

type UploadWebhookResult = {
  drive_file_id?: string
  drive_web_view_link?: string
  drive_download_link?: string
  drive_folder_id?: string
  source_url?: string
}

const readUploadBody = async (event: H3Event) => {
  const form = await readMultipartFormData(event)
  const fields = new Map<string, string>()
  let uploadedFile: { filename: string, mimeType: string, data: Buffer } | null = null

  for (const part of form ?? []) {
    if (part.filename) {
      uploadedFile = {
        filename: part.filename,
        mimeType: part.type || 'application/octet-stream',
        data: part.data,
      }
      continue
    }

    if (part.name) {
      fields.set(part.name, part.data.toString('utf8'))
    }
  }

  return {
    uploadedFile,
    transcriber: fields.get('transcriber') || 'deepgram',
    autoTranscribe: fields.get('autoTranscribe') !== 'false',
  }
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

const extractUploadWebhookResult = (payload: unknown): UploadWebhookResult => {
  if (!payload || typeof payload !== 'object') {
    return {}
  }

  const candidate = payload as Record<string, unknown>
  const nested = typeof candidate.data === 'object' && candidate.data
    ? candidate.data as Record<string, unknown>
    : null

  const getString = (value: unknown) => typeof value === 'string' ? value.trim() : ''

  return {
    drive_file_id: getString(candidate.drive_file_id) || getString(nested?.drive_file_id),
    drive_web_view_link: getString(candidate.drive_web_view_link) || getString(nested?.drive_web_view_link),
    drive_download_link: getString(candidate.drive_download_link) || getString(nested?.drive_download_link),
    drive_folder_id: getString(candidate.drive_folder_id) || getString(nested?.drive_folder_id) || getString(candidate.folder_id) || getString(nested?.folder_id),
    source_url: getString(candidate.source_url) || getString(nested?.source_url),
  }
}

const buildDriveWebViewLink = (driveFileId: string | null) => {
  const normalizedId = typeof driveFileId === 'string' ? driveFileId.trim() : ''
  return normalizedId ? `https://drive.google.com/file/d/${normalizedId}/view` : null
}

export default defineEventHandler(async (event) => {
  const user = await requireSupabaseUser(event)
  const config = useRuntimeConfig(event)
  const supabase = getSupabaseAdmin(event)
  const { uploadedFile, transcriber, autoTranscribe } = await readUploadBody(event)

  if (!uploadedFile) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Upload a file before starting transcription.',
    })
  }

  if (!['assemblyai', 'deepgram', 'whisper'].includes(transcriber)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Unsupported transcriber selection.',
    })
  }

  if (uploadedFile.data.length > 200 * 1024 * 1024) {
    throw createError({
      statusCode: 400,
      statusMessage: 'File is too large. Keep uploads under 200MB.',
    })
  }

  if (!config.videoToTextUploadWebhookUrl || !config.videoToTextApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Video to text upload webhook is not configured.',
    })
  }

  const { data: createdFile, error: createErrorResult } = await supabase
    .from('transcription_files')
    .insert({
      user_id: user.id,
      file_name: uploadedFile.filename,
      mime_type: uploadedFile.mimeType,
      file_size_bytes: uploadedFile.data.length,
      source_type: 'upload',
      status: 'uploaded',
      transcriber,
    })
    .select(transcriptionFileSelect)
    .single()

  if (createErrorResult || !createdFile) {
    throw createError({
      statusCode: 500,
      statusMessage: createErrorResult?.message || 'Could not create transcription file record.',
    })
  }

  const encodedFile = uploadedFile.data.toString('base64')

  let uploadResult: UploadWebhookResult = {}
  try {
    const uploadResponse = await $fetch.raw(config.videoToTextUploadWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.videoToTextApiKey,
      },
      ignoreResponseError: true,
      body: {
        file_name: uploadedFile.filename,
        mime_type: uploadedFile.mimeType,
        file_base64: encodedFile,
        folder_id: config.videoToTextDriveFolderId || '',
        user_id: user.id,
        transcription_file_id: createdFile.id,
      },
    })

    if (!uploadResponse.ok) {
      const message
        = typeof uploadResponse._data === 'object'
          && uploadResponse._data !== null
          && 'message' in uploadResponse._data
          && typeof uploadResponse._data.message === 'string'
          ? uploadResponse._data.message
          : `Upload webhook returned ${uploadResponse.status}.`

      throw new Error(message)
    }

    uploadResult = extractUploadWebhookResult(uploadResponse._data)
  }
  catch (error) {
    await supabase
      .from('transcription_files')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Upload to Google Drive failed.',
      })
      .eq('id', createdFile.id)
      .eq('user_id', user.id)

    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Upload to Google Drive failed.',
    })
  }

  const driveFileId = uploadResult.drive_file_id || null
  const driveWebViewLink = uploadResult.drive_web_view_link || buildDriveWebViewLink(driveFileId)
  const sourceUrl = driveWebViewLink || uploadResult.source_url || null
  const driveFolderId = uploadResult.drive_folder_id || config.videoToTextDriveFolderId || null

  const { data: uploadedFileRecord, error: uploadedFileError } = await supabase
    .from('transcription_files')
    .update({
      source_url: sourceUrl,
      drive_file_id: driveFileId,
      drive_web_view_link: driveWebViewLink,
      drive_download_link: uploadResult.drive_download_link || null,
      drive_folder_id: driveFolderId,
      status: autoTranscribe ? 'queued' : 'uploaded',
      error_message: null,
    })
    .eq('id', createdFile.id)
    .eq('user_id', user.id)
    .select(transcriptionFileSelect)
    .single()

  if (uploadedFileError || !uploadedFileRecord) {
    throw createError({
      statusCode: 500,
      statusMessage: uploadedFileError?.message || 'Uploaded file record could not be updated.',
    })
  }

  if (!autoTranscribe) {
    return {
      ok: true,
      file: {
        ...uploadedFileRecord,
        highlights: mapHighlights(uploadedFileRecord.highlights),
      },
    }
  }

  if (!config.videoToTextWebhookUrl || !config.videoToTextApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Video to text webhook configuration is missing.',
    })
  }

  if (!driveFileId && !sourceUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Uploaded file is missing Google Drive metadata for transcription.',
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
    sourceUrl: sourceUrl || uploadedFile.filename,
    source: 'gdrive',
    transcriber: transcriber as 'assemblyai' | 'deepgram' | 'whisper',
    createdAt: now,
    updatedAt: now,
  }, event)

  const { error: runInsertError } = await supabase
    .from('transcription_runs')
    .insert({
      transcription_file_id: uploadedFileRecord.id,
      user_id: user.id,
      job_id: jobId,
      callback_url: callbackUrl || null,
      transcriber,
      status: 'processing',
      source_url: sourceUrl,
      started_at: now,
    })

  if (runInsertError) {
    throw createError({
      statusCode: 500,
      statusMessage: runInsertError.message,
    })
  }

  const startResponse = await $fetch.raw<{ message?: string }>(config.videoToTextWebhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': config.videoToTextApiKey,
    },
    ignoreResponseError: true,
    body: {
      job_id: jobId,
      url: sourceUrl || '',
      source: 'gdrive',
      transcriber,
      gdrive_file_id: driveFileId || '',
      callback_url: callbackUrl,
    },
  })

  if (!startResponse.ok) {
    const message
      = typeof startResponse._data === 'object'
        && startResponse._data !== null
        && 'message' in startResponse._data
        && typeof startResponse._data.message === 'string'
        ? startResponse._data.message
        : `Video to text webhook returned ${startResponse.status}.`

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
      .eq('id', uploadedFileRecord.id)
      .eq('user_id', user.id)

    throw createError({
      statusCode: 500,
      statusMessage: message,
    })
  }

  await supabase
    .from('transcription_files')
    .update({
      status: 'processing',
      error_message: null,
      transcriber,
      metadata: {
        ...(uploadedFileRecord.metadata ?? {}),
        last_job_id: jobId,
      },
    })
    .eq('id', uploadedFileRecord.id)
    .eq('user_id', user.id)

  const { data: finalFile } = await supabase
    .from('transcription_files')
    .select(transcriptionFileSelect)
    .eq('id', uploadedFileRecord.id)
    .eq('user_id', user.id)
    .single()

  return {
    ok: true,
    file: finalFile
      ? {
          ...finalFile,
          highlights: mapHighlights(finalFile.highlights),
        }
      : null,
    jobId,
    callbackReachable,
    callbackUrl,
    message: callbackReachable
      ? 'File uploaded to Google Drive and transcription started.'
      : 'File uploaded to Google Drive. Callback URL is not reachable yet.',
  }
})
