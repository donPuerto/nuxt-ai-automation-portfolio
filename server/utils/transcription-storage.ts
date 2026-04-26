import type { SupabaseClient } from '@supabase/supabase-js'

export type UploadedTranscriptionMediaFile = {
  filename: string
  mimeType: string
  data: Buffer
}

const TRANSCRIPTION_MEDIA_BUCKET = 'transcription-media'
const SIGNED_URL_TTL_SECONDS = 60 * 60

const sanitizeFileName = (value: string) => {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '-')
}

export const getTranscriptionMediaBucket = () => TRANSCRIPTION_MEDIA_BUCKET

export const getSignedTranscriptionMediaUrlTtl = () => SIGNED_URL_TTL_SECONDS

export const getTranscriptionStorageMeta = (metadata: Record<string, unknown> | null | undefined) => {
  const bucket = typeof metadata?.storage_bucket === 'string' ? metadata.storage_bucket.trim() : ''
  const path = typeof metadata?.storage_path === 'string' ? metadata.storage_path.trim() : ''

  return {
    bucket,
    path,
  }
}

export const buildTranscriptionMediaPath = (fileId: string, fileName: string) => {
  return `transcription-files/${fileId}/${sanitizeFileName(fileName)}`
}

export const ensureTranscriptionMediaBucket = async (supabase: SupabaseClient) => {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()

  if (listError) {
    throw new Error(listError.message)
  }

  const exists = buckets?.some(bucket => bucket.name === TRANSCRIPTION_MEDIA_BUCKET)
  if (exists) {
    return
  }

  const { error: createError } = await supabase.storage.createBucket(TRANSCRIPTION_MEDIA_BUCKET, {
    public: false,
  })

  if (createError && !createError.message.toLowerCase().includes('already exists')) {
    throw new Error(createError.message)
  }
}

export const uploadTranscriptionMediaFile = async ({
  supabase,
  fileId,
  file,
}: {
  supabase: SupabaseClient
  fileId: string
  file: UploadedTranscriptionMediaFile
}) => {
  await ensureTranscriptionMediaBucket(supabase)

  const storagePath = buildTranscriptionMediaPath(fileId, file.filename)
  const { error } = await supabase.storage
    .from(TRANSCRIPTION_MEDIA_BUCKET)
    .upload(storagePath, file.data, {
      contentType: file.mimeType || 'application/octet-stream',
      upsert: true,
    })

  if (error) {
    throw new Error(error.message)
  }

  return {
    bucket: TRANSCRIPTION_MEDIA_BUCKET,
    path: storagePath,
  }
}

export const createSignedTranscriptionMediaUrl = async ({
  supabase,
  bucket,
  path,
  expiresIn = SIGNED_URL_TTL_SECONDS,
}: {
  supabase: SupabaseClient
  bucket?: string | null
  path?: string | null
  expiresIn?: number
}) => {
  const normalizedBucket = typeof bucket === 'string' ? bucket.trim() : ''
  const normalizedPath = typeof path === 'string' ? path.trim() : ''

  if (!normalizedBucket || !normalizedPath) {
    return null
  }

  const { data, error } = await supabase.storage
    .from(normalizedBucket)
    .createSignedUrl(normalizedPath, expiresIn)

  if (error) {
    throw new Error(error.message)
  }

  return data?.signedUrl ?? null
}

export const removeTranscriptionMediaFile = async ({
  supabase,
  bucket,
  path,
}: {
  supabase: SupabaseClient
  bucket?: string | null
  path?: string | null
}) => {
  const normalizedBucket = typeof bucket === 'string' ? bucket.trim() : ''
  const normalizedPath = typeof path === 'string' ? path.trim() : ''

  if (!normalizedBucket || !normalizedPath) {
    return
  }

  const { error } = await supabase.storage
    .from(normalizedBucket)
    .remove([normalizedPath])

  if (error && !error.message.toLowerCase().includes('not found')) {
    throw new Error(error.message)
  }
}
