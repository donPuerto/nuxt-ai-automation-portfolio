import { createClient } from '@supabase/supabase-js'

const hasSupabaseAuthHash = (hash: string) => {
  const normalizedHash = hash.replace(/^#/, '')
  return /(?:^|&)(access_token|refresh_token|expires_at|expires_in|provider_token|token_type|error|error_code)=/i.test(normalizedHash)
}

const getSupabaseProjectRef = (supabaseUrl: string) => {
  try {
    return new URL(supabaseUrl).hostname.split('.')[0] ?? ''
  }
  catch {
    return ''
  }
}

const clearStaleSupabaseStorage = (activeProjectRef: string) => {
  if (!activeProjectRef || !import.meta.client) {
    return
  }

  const clearFromStorage = (storage: Storage) => {
    const keysToRemove: string[] = []

    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index)
      if (!key) {
        continue
      }

      if (key.startsWith('sb-') && key.endsWith('-auth-token') && !key.includes(`sb-${activeProjectRef}-auth-token`)) {
        keysToRemove.push(key)
      }
    }

    for (const key of keysToRemove) {
      storage.removeItem(key)
    }
  }

  clearFromStorage(window.localStorage)
  clearFromStorage(window.sessionStorage)
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const supabaseUrl = config.public.supabaseUrl
  const supabaseKey = config.public.supabaseKey
  const projectRef = getSupabaseProjectRef(supabaseUrl)

  if (import.meta.client && projectRef) {
    clearStaleSupabaseStorage(projectRef)
  }

  const isConfigured = Boolean(supabaseUrl && supabaseKey)
  const supabase = isConfigured
    ? createClient(supabaseUrl, supabaseKey, {
        auth: {
          detectSessionInUrl: true,
          flowType: 'pkce',
          storageKey: projectRef ? `sb-${projectRef}-auth-token` : undefined,
        },
      })
    : null

  if (!isConfigured && import.meta.dev) {
    console.warn('[supabase] Runtime config missing. Set NUXT_PUBLIC_SUPABASE_URL and NUXT_PUBLIC_SUPABASE_KEY to enable Supabase features.')
  }

  if (import.meta.client && supabase) {
    supabase.auth.onAuthStateChange((event) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && hasSupabaseAuthHash(window.location.hash)) {
        window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`)
      }
    })
  }

  return {
    provide: {
      supabase,
      supabaseConfigured: isConfigured,
    },
  }
})
