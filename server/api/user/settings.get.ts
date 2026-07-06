import { createClient } from '@supabase/supabase-js'

const isMissingTableError = (error: { code?: string, message?: string } | null | undefined, tableName: string) => {
  if (!error) {
    return false
  }

  if (error.code === 'PGRST205') {
    return true
  }

  const message = error.message?.toLowerCase() ?? ''
  return message.includes('could not find the table')
    && message.includes(`public.${tableName}`.toLowerCase())
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const supabaseUrl = config.public.supabaseUrl as string
  const supabaseKey = config.public.supabaseKey as string

  if (!supabaseUrl || !supabaseKey) {
    throw createError({ statusCode: 500, statusMessage: 'Supabase is not configured.' })
  }

  const authorization = getHeader(event, 'authorization')
  const accessToken = authorization?.replace(/^Bearer\s+/i, '').trim()

  if (!accessToken) {
    throw createError({ statusCode: 401, statusMessage: 'Sign in is required.' })
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  })

  const { data: authData, error: authError } = await supabase.auth.getUser(accessToken)
  const userId = authData.user?.id ?? null

  if (authError || !userId) {
    throw createError({
      statusCode: 401,
      statusMessage: authError?.message || 'Invalid session token.',
    })
  }

  const [profileResult, preferencesResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('first_name,last_name,nickname,email,mobile_number,phone_number,work_description')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('user_settings')
      .select('notify_response_completions,notify_web_app_emails,notify_dispatch_messages,welcome_seen,color_mode,font_family,agent_provider,agent_model')
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  if (profileResult.error && !isMissingTableError(profileResult.error, 'profiles')) {
    throw createError({ statusCode: 500, statusMessage: profileResult.error.message })
  }
  if (preferencesResult.error && !isMissingTableError(preferencesResult.error, 'user_settings')) {
    throw createError({ statusCode: 500, statusMessage: preferencesResult.error.message })
  }

  return {
    profile: isMissingTableError(profileResult.error, 'profiles') ? null : profileResult.data,
    preferences: isMissingTableError(preferencesResult.error, 'user_settings') ? null : preferencesResult.data,
  }
})
