import { createClient } from '@supabase/supabase-js'

const decodeJwtPayload = (token: string): Record<string, unknown> => {
  const [, payload] = token.split('.')
  if (!payload) return {}
  return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
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

  // Decode JWT locally — no network round-trip needed.
  // PostgREST validates the token signature on every query, so tampered tokens are rejected there.
  const payload = decodeJwtPayload(accessToken)
  const userId = typeof payload.sub === 'string' ? payload.sub : null

  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid session token.' })
  }

  // Check token expiry
  if (typeof payload.exp === 'number' && payload.exp < Math.floor(Date.now() / 1000)) {
    throw createError({ statusCode: 401, statusMessage: 'Your session expired. Please sign in again.' })
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  })

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

  if (profileResult.error) {
    throw createError({ statusCode: 500, statusMessage: profileResult.error.message })
  }
  if (preferencesResult.error) {
    throw createError({ statusCode: 500, statusMessage: preferencesResult.error.message })
  }

  return {
    profile: profileResult.data,
    preferences: preferencesResult.data,
  }
})
