import { createClient } from '@supabase/supabase-js'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const supabaseUrl = config.public.supabaseUrl
  const supabaseKey = config.public.supabaseKey

  const isConfigured = Boolean(supabaseUrl && supabaseKey)
  const supabase = isConfigured
    ? createClient(supabaseUrl, supabaseKey)
    : null

  if (!isConfigured && import.meta.dev) {
    console.warn('[supabase] Runtime config missing. Set NUXT_PUBLIC_SUPABASE_URL and NUXT_PUBLIC_SUPABASE_KEY to enable Supabase features.')
  }

  return {
    provide: {
      supabase,
      supabaseConfigured: isConfigured,
    },
  }
})
