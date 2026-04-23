import { getSupabaseAdmin } from '../../../../utils/supabase-admin'
import { requireSupabaseUser } from '../../../../utils/knowledge-auth'

export default defineEventHandler(async (event) => {
  const user = await requireSupabaseUser(event)
  const config = useRuntimeConfig(event)
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
    .select('id,user_id,drive_file_id,metadata')
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

  let driveDeleteError: string | null = null
  if (file.drive_file_id && config.videoToTextDeleteWebhookUrl && config.videoToTextApiKey) {
    try {
      const response = await $fetch.raw(config.videoToTextDeleteWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': config.videoToTextApiKey,
        },
        ignoreResponseError: true,
        body: {
          drive_file_id: file.drive_file_id,
          user_id: user.id,
          transcription_file_id: file.id,
        },
      })

      if (!response.ok) {
        driveDeleteError = `Drive delete webhook returned ${response.status}.`
      }
    }
    catch (error) {
      driveDeleteError = error instanceof Error ? error.message : 'Drive delete failed.'
    }
  }

  const { error: updateError } = await supabase
    .from('transcription_files')
    .update({
      status: 'deleted',
      deleted_at: new Date().toISOString(),
      error_message: driveDeleteError,
      metadata: {
        ...(file.metadata ?? {}),
        drive_delete_error: driveDeleteError,
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
    driveDeleteError,
  }
})
