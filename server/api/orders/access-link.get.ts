import { getSupabaseAdmin } from '../../utils/supabase-admin'

export default defineEventHandler(async (event) => {
  const token = getQuery(event).token

  if (typeof token !== 'string' || token.trim().length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Access token is required.',
    })
  }

  const supabase = getSupabaseAdmin(event)
  const { data: accessRow, error: accessError } = await supabase
    .from('template_access')
    .select('buyer_email, templates(file_url)')
    .eq('access_token', token.trim())
    .maybeSingle()

  if (accessError) {
    throw createError({
      statusCode: 500,
      statusMessage: accessError.message,
    })
  }

  if (!accessRow) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Access token is invalid or expired.',
    })
  }

  const templateFileUrl = Array.isArray(accessRow.templates)
    ? accessRow.templates[0]?.file_url
    : (accessRow.templates as { file_url?: string } | null)?.file_url

  if (!templateFileUrl) {
    throw createError({
      statusCode: 404,
      statusMessage: 'No downloadable file is attached to this template yet.',
    })
  }

  return {
    buyerEmail: accessRow.buyer_email,
    fileUrl: templateFileUrl,
  }
})
