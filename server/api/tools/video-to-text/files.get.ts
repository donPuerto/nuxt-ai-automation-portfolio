import { getSupabaseAdmin } from '../../../utils/supabase-admin'
import { requireSupabaseUser } from '../../../utils/knowledge-auth'
import { mapHighlights, transcriptionFileSelect, type TranscriptionFileRow } from '../../../utils/video-to-text-file-records'

export default defineEventHandler(async (event) => {
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
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  const files = ((data ?? []) as TranscriptionFileRow[]).map(file => ({
    ...file,
    highlights: mapHighlights(file.highlights),
  }))

  return { files }
})
