import type { RouterConfig } from '@nuxt/schema'

const hasSupabaseAuthHash = (hash: string) => {
  const normalizedHash = hash.replace(/^#/, '')
  return /(?:^|&)(access_token|refresh_token|expires_at|expires_in|provider_token|token_type|error|error_code)=/i.test(normalizedHash)
}

export default <RouterConfig>{
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }

    if (to.hash && !hasSupabaseAuthHash(to.hash)) {
      return {
        el: to.hash,
        top: 0,
      }
    }

    return {
      top: 0,
    }
  },
}
