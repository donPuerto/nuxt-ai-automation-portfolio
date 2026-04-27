import { getSupabaseAdmin } from '../../../../../utils/supabase-admin'
import { requireSupabaseUser } from '../../../../../utils/knowledge-auth'
import {
  buildTranscriptionMediaPath,
  createSignedTranscriptionMediaUrl,
  getSignedTranscriptionMediaUrlTtl,
  getTranscriptionMediaBucket,
} from '../../../../../utils/transcription-storage'
import { buildTranscriptionSourceRelayUrl } from '../../../../../utils/transcription-source-relay'
import { setVideoToTextJob } from '../../../../../utils/video-to-text-jobs'
import { mapHighlights, transcriptionFileSelect } from '../../../../../utils/video-to-text-file-records'
import { buildWordBoostFromFileName } from '../../../../../utils/video-to-text-word-boost'

type CompleteUploadBody = {
  fileId?: string
  fileName?: string
  mimeType?: string
  fileSizeBytes?: number
  bucket?: string
  path?: string
  transcriber?: 'assemblyai' | 'deepgram' | 'whisper'
  autoTranscribe?: boolean
}

const MAX_DIRECT_UPLOAD_FILE_BYTES = 512 * 1024 * 1024

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
  const body = await readBody<CompleteUploadBody>(event)
  const supabase = getSupabaseAdmin(event)

  const fileId = typeof body?.fileId === 'string' ? body.fileId.trim() : ''
  const fileName = typeof body?.fileName === 'string' ? body.fileName.trim() : ''
  const mimeType = typeof body?.mimeType === 'string' ? body.mimeType.trim() : 'application/octet-stream'
  const fileSizeBytes = Number.isFinite(body?.fileSizeBytes) ? Number(body.fileSizeBytes) : 0
  const bucket = typeof body?.bucket === 'string' ? body.bucket.trim() : ''
  const path = typeof body?.path === 'string' ? body.path.trim() : ''
  const transcriber = body?.transcriber && ['assemblyai', 'deepgram', 'whisper'].includes(body.transcriber)
    ? body.transcriber
    : 'deepgram'
  const autoTranscribe = body?.autoTranscribe !== false

  if (!fileId || !fileName || !bucket || !path || fileSizeBytes <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing upload completion details.',
    })
  }

  if (fileSizeBytes > MAX_DIRECT_UPLOAD_FILE_BYTES) {
    throw createError({
      statusCode: 413,
      statusMessage: 'File is too large. Keep uploads under 512MB.',
    })
  }

  const expectedBucket = getTranscriptionMediaBucket()
  const expectedPath = buildTranscriptionMediaPath(fileId, fileName)

  if (bucket !== expectedBucket || path !== expectedPath) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Upload path mismatch. Retry the upload.',
    })
  }

  const { data: createdFile, error: createErrorResult } = await supabase
    .from('transcription_files')
    .insert({
      id: fileId,
      user_id: user.id,
      file_name: fileName,
      mime_type: mimeType,
      file_size_bytes: fileSizeBytes,
      source_type: 'upload',
      status: autoTranscribe ? 'queued' : 'uploaded',
      transcriber,
      metadata: {
        storage_bucket: bucket,
        storage_path: path,
        upload_provider: 'supabase-storage',
      },
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
    const sourceUrl = await createSignedTranscriptionMediaUrl({
      supabase,
      bucket,
      path,
      expiresIn: getSignedTranscriptionMediaUrlTtl(),
    })

    const { data: uploadedFileRecord, error: uploadedFileError } = await supabase
      .from('transcription_files')
      .update({
        source_url: sourceUrl,
        status: autoTranscribe ? 'queued' : 'uploaded',
        error_message: null,
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
    const fallbackCallbackUrl = isPublicOrigin(siteUrl)
      ? `${siteUrl.replace(/\/$/, '')}/api/tools/video-to-text/callback/${jobId}`
      : ''
    const configuredCallbackUrl = config.videoToTextCallbackUrl?.trim()
      ? buildConfiguredCallbackUrl(config.videoToTextCallbackUrl.trim(), jobId)
      : ''
    const callbackUrl = fallbackCallbackUrl || configuredCallbackUrl
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
        word_boost: buildWordBoostFromFileName(fileName),
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
