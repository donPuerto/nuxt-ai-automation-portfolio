import { getSupabaseAdmin } from '../../../../../utils/supabase-admin'
import {
  createSignedTranscriptionMediaUrl,
  getTranscriptionStorageMeta,
} from '../../../../../utils/transcription-storage'
import { transcriptionFileSelect } from '../../../../../utils/video-to-text-file-records'
import { verifyTranscriptionSourceRelayAccess } from '../../../../../utils/transcription-source-relay'

export default defineEventHandler(async (event) => {
  const fileId = getRouterParam(event, 'id')
  const token = getQuery(event).token
  const expires = getQuery(event).expires
  const config = useRuntimeConfig(event)
  const relaySecret = config.videoToTextApiKey?.trim() || config.supabaseServiceRoleKey?.trim() || ''

  if (!fileId || typeof token !== 'string' || typeof expires !== 'string' || !relaySecret) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid file relay request.',
    })
  }

  const allowed = verifyTranscriptionSourceRelayAccess({
    fileId,
    expiresAtRaw: expires,
    token,
    secret: relaySecret,
  })

  if (!allowed) {
    throw createError({
      statusCode: 401,
      statusMessage: 'File relay token is invalid or expired.',
    })
  }

  const supabase = getSupabaseAdmin(event)
  const { data: file, error: fileError } = await supabase
    .from('transcription_files')
    .select(transcriptionFileSelect)
    .eq('id', fileId)
    .is('deleted_at', null)
    .single()

  if (fileError || !file) {
    throw createError({
      statusCode: 404,
      statusMessage: fileError?.message || 'Transcription file not found.',
    })
  }

  const storageMeta = getTranscriptionStorageMeta(file.metadata)
  const signedStorageUrl = await createSignedTranscriptionMediaUrl({
    supabase,
    bucket: storageMeta.bucket,
    path: storageMeta.path,
  })

  if (!signedStorageUrl) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Transcription file source is not available.',
    })
  }

  const upstreamResponse = await fetch(signedStorageUrl)
  if (!upstreamResponse.ok || !upstreamResponse.body) {
    throw createError({
      statusCode: 502,
      statusMessage: `Could not stream transcription file (${upstreamResponse.status}).`,
    })
  }

  const headers = new Headers()
  const contentType = file.mime_type?.trim() || upstreamResponse.headers.get('content-type') || 'application/octet-stream'
  const contentLength = upstreamResponse.headers.get('content-length')
  const fileName = file.file_name.replace(/"/g, '')

  headers.set('content-type', contentType)
  headers.set('cache-control', 'private, max-age=60, no-transform')
  headers.set('content-disposition', `inline; filename="${fileName}"`)

  if (contentLength) {
    headers.set('content-length', contentLength)
  }

  return new Response(upstreamResponse.body, {
    status: 200,
    headers,
  })
})
