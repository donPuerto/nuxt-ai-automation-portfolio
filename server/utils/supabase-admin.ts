import { createClient } from '@supabase/supabase-js'
import type { H3Event } from 'h3'

const resolveSupabaseAdminConfig = (event: H3Event) => {
  const config = useRuntimeConfig(event)
  const supabaseUrl
    = config.public.supabaseUrl
      || process.env.NUXT_PUBLIC_SUPABASE_URL
      || process.env.SUPABASE_URL
      || ''
  const serviceRoleKey
    = config.supabaseServiceRoleKey
      || process.env.SUPABASE_SERVICE_ROLE_KEY
      || process.env.NUXT_SUPABASE_SERVICE_ROLE_KEY
      || ''

  return {
    supabaseUrl,
    serviceRoleKey,
  }
}

export const hasSupabaseAdminConfig = (event: H3Event) => {
  const { supabaseUrl, serviceRoleKey } = resolveSupabaseAdminConfig(event)
  return Boolean(supabaseUrl && serviceRoleKey)
}

export const getSupabaseAdmin = (event: H3Event) => {
  const { supabaseUrl, serviceRoleKey } = resolveSupabaseAdminConfig(event)

  if (!supabaseUrl || !serviceRoleKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase admin credentials are not configured.',
    })
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
