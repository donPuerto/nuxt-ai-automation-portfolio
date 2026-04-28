import { createClient } from '@supabase/supabase-js'
import type { H3Event } from 'h3'

const buildAnonClient = (event: H3Event) => {
  const config = useRuntimeConfig(event)
  const supabaseUrl = config.public.supabaseUrl
  const supabaseKey = config.public.supabaseKey
  if (!supabaseUrl || !supabaseKey) return null
  return createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  })
}

export const tryGetSupabaseUser = async (event: H3Event) => {
  const authorization = getHeader(event, 'authorization')
  const accessToken = authorization?.replace(/^Bearer\s+/i, '').trim()
  if (!accessToken) return null
  const supabase = buildAnonClient(event)
  if (!supabase) return null
  try {
    const { data, error } = await supabase.auth.getUser(accessToken)
    return error || !data.user ? null : data.user
  }
  catch {
    return null
  }
}

export const requireSupabaseUser = async (event: H3Event) => {
  const config = useRuntimeConfig(event)
  const supabaseUrl = config.public.supabaseUrl
  const supabaseKey = config.public.supabaseKey

  if (!supabaseUrl || !supabaseKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase is not configured.',
    })
  }

  const authorization = getHeader(event, 'authorization')
  const accessToken = authorization?.replace(/^Bearer\s+/i, '').trim()

  if (!accessToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Sign in is required.',
    })
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })

  const { data, error } = await supabase.auth.getUser(accessToken)

  if (error || !data.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Your session expired. Please sign in again.',
    })
  }

  return data.user
}
