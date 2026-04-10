import { createClient } from '@supabase/supabase-js'

type SignupBody = {
  email?: string
  password?: string
  fullName?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<SignupBody>(event)
  const email = body?.email?.trim()
  const password = body?.password
  const fullName = body?.fullName?.trim()

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

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || null,
      },
    },
  })

  if (error) {
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Unable to create account.',
    })
  }

  return {
    user: data.user
      ? {
          id: data.user.id,
          email: data.user.email,
        }
      : null,
    session: data.session
      ? {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
          token_type: data.session.token_type,
        }
      : null,
    message: data.session
      ? 'Account created and signed in.'
      : 'Account created. Check your email to confirm your address.',
  }
})

