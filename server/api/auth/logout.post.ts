import { createClient } from '@supabase/supabase-js'

type LogoutBody = {
  accessToken?: string
  refreshToken?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<LogoutBody>(event)

  const config = useRuntimeConfig(event)
  const supabaseUrl = config.public.supabaseUrl
  const supabaseKey = config.public.supabaseKey

  if (!supabaseUrl || !supabaseKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase is not configured.',
    })
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })

  const accessToken = body?.accessToken?.trim()
  const refreshToken = body?.refreshToken?.trim()
  if (accessToken && refreshToken) {
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    if (sessionError) {
      throw createError({
        statusCode: 400,
        statusMessage: sessionError.message || 'Invalid session tokens.',
      })
    }
  }

  const { error } = await supabase.auth.signOut({ scope: 'local' })
  if (error) {
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Logout failed.',
    })
  }

  return { success: true }
})

