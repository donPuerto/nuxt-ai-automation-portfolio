import type { SupabaseClient } from '@supabase/supabase-js'

export function useSupabaseClient(): SupabaseClient {
  const nuxtApp = useNuxtApp()
  const client = nuxtApp.$supabase as SupabaseClient | null

  if (!client) {
    throw new Error('Supabase is not configured. Set NUXT_PUBLIC_SUPABASE_URL and NUXT_PUBLIC_SUPABASE_KEY.')
  }

  return client
}

export function useSupabaseConfigured(): boolean {
  return Boolean((useNuxtApp() as { $supabaseConfigured?: boolean }).$supabaseConfigured)
}
