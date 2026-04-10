import { createClient } from '@supabase/supabase-js'

type LoginBody = {
  email?: string
  password?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<LoginBody>(event)
  const email = body?.email?.trim()
  const password = body?.password

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email and password are required.',
    })
  }

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

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw createError({
      statusCode: 401,
      statusMessage: error.message || 'Invalid email or password.',
    })
  }

  if (!data.session || !data.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication failed. Session was not created.',
    })
  }

  return {
    user: {
      id: data.user.id,
      email: data.user.email,
    },
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      token_type: data.session.token_type,
    },
  }
})

