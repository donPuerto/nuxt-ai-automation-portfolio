import { getSupabaseAdmin } from '../../../../../utils/supabase-admin'
import { requireSupabaseUser } from '../../../../../utils/knowledge-auth'
import {
  buildTranscriptionMediaPath,
  ensureTranscriptionMediaBucket,
  getTranscriptionMediaBucket,
} from '../../../../../utils/transcription-storage'

type CreateUploadSignedUrlBody = {
  fileName?: string
  fileSizeBytes?: number
}

const MAX_DIRECT_UPLOAD_FILE_BYTES = 2 * 1024 * 1024 * 1024

export default defineEventHandler(async (event) => {
  await requireSupabaseUser(event)
  const body = await readBody<CreateUploadSignedUrlBody>(event)

  const fileName = typeof body?.fileName === 'string' ? body.fileName.trim() : ''
  const fileSizeBytes = Number.isFinite(body?.fileSizeBytes) ? Number(body.fileSizeBytes) : 0

  if (!fileName) {
    throw createError({
      statusCode: 400,
      statusMessage: 'File name is required.',
    })
  }

  if (fileSizeBytes <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'File size is required.',
    })
  }

  if (fileSizeBytes > MAX_DIRECT_UPLOAD_FILE_BYTES) {
    throw createError({
      statusCode: 413,
      statusMessage: 'File is too large. Keep uploads under 2GB.',
    })
  }

  const supabase = getSupabaseAdmin(event)
  await ensureTranscriptionMediaBucket(supabase)

  const fileId = crypto.randomUUID()
  const bucket = getTranscriptionMediaBucket()
  const path = buildTranscriptionMediaPath(fileId, fileName)
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(path)

  if (error || !data?.token) {
    throw createError({
      statusCode: 500,
      statusMessage: error?.message || 'Could not prepare signed upload URL.',
    })
  }

  return {
    bucket,
    path,
    fileId,
    token: data.token,
    maxFileSizeBytes: MAX_DIRECT_UPLOAD_FILE_BYTES,
  }
})
