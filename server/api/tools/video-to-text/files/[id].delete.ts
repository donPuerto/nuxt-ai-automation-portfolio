import { getSupabaseAdmin } from '../../../../utils/supabase-admin'
import { requireSupabaseUser } from '../../../../utils/knowledge-auth'
import { getTranscriptionStorageMeta, removeTranscriptionMediaFile } from '../../../../utils/transcription-storage'

export default defineEventHandler(async (event) => {
  const user = await requireSupabaseUser(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'File id is required.',
    })
  }

  const supabase = getSupabaseAdmin(event)
  const { data: file, error: fileError } = await supabase
    .from('transcription_files')
    .select('id,user_id,metadata')
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

  const storageMeta = getTranscriptionStorageMeta(file.metadata)
  let storageDeleteError: string | null = null
  if (storageMeta.bucket && storageMeta.path) {
    try {
      await removeTranscriptionMediaFile({
        supabase,
        bucket: storageMeta.bucket,
        path: storageMeta.path,
      })
    }
    catch (error) {
      storageDeleteError = error instanceof Error ? error.message : 'Supabase Storage delete failed.'
    }
  }

  const { error: updateError } = await supabase
    .from('transcription_files')
    .update({
      status: 'deleted',
      deleted_at: new Date().toISOString(),
      error_message: storageDeleteError,
      metadata: {
        ...(file.metadata ?? {}),
        storage_delete_error: storageDeleteError,
      },
    })
    .eq('id', file.id)
    .eq('user_id', user.id)

  if (updateError) {
    throw createError({
      statusCode: 500,
      statusMessage: updateError.message,
    })
  }

  return {
    success: true,
    storageDeleteError,
  }
})
