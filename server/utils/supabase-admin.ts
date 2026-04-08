import { createClient } from '@supabase/supabase-js'
import type { H3Event } from 'h3'

export const getSupabaseAdmin = (event: H3Event) => {
  const config = useRuntimeConfig(event)

  if (!config.public.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase admin credentials are not configured.',
    })
  }

  return createClient(config.public.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
