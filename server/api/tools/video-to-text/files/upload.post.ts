import type { H3Event } from 'h3'
import { getSupabaseAdmin } from '../../../../utils/supabase-admin'
import { requireSupabaseUser } from '../../../../utils/knowledge-auth'
import {
  createSignedTranscriptionMediaUrl,
  getSignedTranscriptionMediaUrlTtl,
  uploadTranscriptionMediaFile,
} from '../../../../utils/transcription-storage'
import { buildTranscriptionSourceRelayUrl } from '../../../../utils/transcription-source-relay'
import { setVideoToTextJob } from '../../../../utils/video-to-text-jobs'
import { mapHighlights, transcriptionFileSelect } from '../../../../utils/video-to-text-file-records'

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

  try {
    const storageTarget = await uploadTranscriptionMediaFile({
      supabase,
      fileId: createdFile.id,
      file: uploadedFile,
    })
    const sourceUrl = await createSignedTranscriptionMediaUrl({
      supabase,
      bucket: storageTarget.bucket,
      path: storageTarget.path,
      expiresIn: getSignedTranscriptionMediaUrlTtl(),
    })

    const { data: uploadedFileRecord, error: uploadedFileError } = await supabase
      .from('transcription_files')
      .update({
        source_url: sourceUrl,
        status: autoTranscribe ? 'queued' : 'uploaded',
        error_message: null,
        metadata: {
          ...(createdFile.metadata ?? {}),
          storage_bucket: storageTarget.bucket,
          storage_path: storageTarget.path,
          upload_provider: 'supabase-storage',
        },
      })
      .eq('id', createdFile.id)
      .eq('user_id', user.id)
      .select(transcriptionFileSelect)
      .single()

    if (uploadedFileError || !uploadedFileRecord) {
      throw new Error(uploadedFileError?.message || 'Uploaded file record could not be updated.')
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
      throw new Error('Video to text webhook configuration is missing.')
    }

    if (!sourceUrl) {
      throw new Error('Uploaded file is missing a Supabase Storage playback URL for transcription.')
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
    const relayOrigin = isPublicOrigin(siteUrl) ? siteUrl : requestOrigin
    const relaySourceUrl = buildTranscriptionSourceRelayUrl({
      origin: relayOrigin,
      fileId: uploadedFileRecord.id,
      secret: config.videoToTextApiKey,
    })

    await setVideoToTextJob({
      id: jobId,
      status: 'processing',
      sourceUrl,
      source: 'supabase',
      transcriber: transcriber as 'assemblyai' | 'deepgram' | 'whisper',
      createdAt: now,
      updatedAt: now,
    }, event)

    const { error: trackError } = await supabase
      .from('transcription_files')
      .update({
        current_job_id: jobId,
        callback_url: callbackUrl || null,
        started_at: now,
        finished_at: null,
        result_payload: null,
        status: 'processing',
        transcriber,
        error_message: null,
        source_url: sourceUrl,
      })
      .eq('id', uploadedFileRecord.id)
      .eq('user_id', user.id)

    if (trackError) {
      throw new Error(trackError.message)
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
        url: relaySourceUrl,
        source: 'upload',
        source_type: 'upload',
        storage_provider: 'supabase-storage',
        transcriber,
        gdrive_file_id: '',
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
        .from('transcription_files')
        .update({
          current_job_id: jobId,
          status: 'failed',
          error_message: message,
          finished_at: new Date().toISOString(),
        })
        .eq('id', uploadedFileRecord.id)
        .eq('user_id', user.id)

      throw new Error(message)
    }

    await supabase
      .from('transcription_files')
      .update({
        status: 'processing',
        error_message: null,
        transcriber,
        current_job_id: jobId,
        callback_url: callbackUrl || null,
        started_at: now,
        finished_at: null,
        result_payload: null,
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
        ? 'File uploaded to Supabase Storage and transcription started.'
        : 'File uploaded to Supabase Storage. Callback URL is not reachable yet.',
    }
  }
  catch (error) {
    await supabase
      .from('transcription_files')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Upload to Supabase Storage failed.',
      })
      .eq('id', createdFile.id)
      .eq('user_id', user.id)

    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Upload to Supabase Storage failed.',
    })
  }
})
