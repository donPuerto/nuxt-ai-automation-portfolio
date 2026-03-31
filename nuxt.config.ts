import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: true,
  experimental: {
    buildCache: false
  },
  features: {
    inlineStyles: true
  },
  nitro: {
   prerender: {
      autoSubfolderIndex: false
    },
    preset: "cloudflare_module",
    cloudflare: {
        deployConfig: true,
        nodeCompat: true
      },
    externals: {
      inline: ['@nuxt/nitro-server']
    }
  },
  css: ['~/assets/css/tailwind.css'],
  plugins: [
      '~/plugins/ssr-width.ts'
  ],
  imports: {
    dirs: ['shared']
  },
  modules: [
    // '@nuxtjs/tailwindcss',
    'shadcn-nuxt',
    '@nuxt/eslint',
    '@nuxt/fonts',
    // '@nuxt/hints',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/scripts',
    //'@nuxt/test-utils',
    '@nuxtjs/color-mode',
    'nuxt-security'
  ],
  components: [
    { path: '~/components', pathPrefix: false, extensions: ['.vue'] },
  ],
  fonts: {
    defaults: {
      weights: [400, 500, 600, 700],
      fallbacks: {
        'sans-serif': ['system-ui', 'Arial'],
        'monospace': ['Courier New'],
      },
    },
    families: [
      // Sans-serif fonts
      { name: 'Inter', provider: 'google' },
      { name: 'Plus Jakarta Sans', provider: 'google' },
      { name: 'Nunito', provider: 'google' },
      { name: 'Quicksand', provider: 'google' },
      { name: 'Orbitron', provider: 'google' },
      { name: 'Inter', provider: 'google' },
      { name: 'Poppins', provider: 'google' },
      { name: 'Roboto', provider: 'google' },
      { name: 'DM Sans', provider: 'google' },
      { name: 'Work Sans', provider: 'google' },
      { name: 'Open Sans', provider: 'google' },
      { name: 'Montserrat', provider: 'google' },
      { name: 'Lato', provider: 'google' },
      { name: 'Raleway', provider: 'google' },
      { name: 'Outfit', provider: 'google' },
      { name: 'Manrope', provider: 'google' },
      { name: 'Space Grotesk', provider: 'google' },
      { name: 'Sora', provider: 'google' },
      { name: 'Lexend', provider: 'google' },
      // Serif fonts
      { name: 'Lora', provider: 'google' },
      { name: 'Merriweather', provider: 'google' },
      { name: 'Playfair Display', provider: 'google' },
      { name: 'Crimson Text', provider: 'google' },
      { name: 'Courier Prime', provider: 'google' },
      { name: 'EB Garamond', provider: 'google' },
      { name: 'Libre Baskerville', provider: 'google' },
      { name: 'Cormorant', provider: 'google' },
      { name: 'Spectral', provider: 'google' },
      { name: 'Bitter', provider: 'google' },
      { name: 'Noto Serif', provider: 'google' },
      // Monospace fonts
      { name: 'Roboto Mono', provider: 'google' },
      { name: 'Fira Code', provider: 'google' },
      { name: 'JetBrains Mono', provider: 'google' },
      { name: 'Source Code Pro', provider: 'google' },
      { name: 'VT323', provider: 'google' },
      { name: 'JetBrains Mono', provider: 'google' },
      { name: 'IBM Plex Mono', provider: 'google' },
      { name: 'Space Mono', provider: 'google' },
      { name: 'Inconsolata', provider: 'google' },
      { name: 'Anonymous Pro', provider: 'google' },
      { name: 'Overpass Mono', provider: 'google' }
    ]
  },
  vite: {
    server: {
      allowedHosts: ['unportioned-mechelle-nonodorously.ngrok-free.dev'],
    },
    plugins: [
      tailwindcss(),
    ],
    build: {
      cssCodeSplit: false,
      chunkSizeWarningLimit: 2500,
      sourcemap: false
    },
    html: {
      cspNonce: undefined
    }
  },
  shadcn: {
    prefix: '',
    componentDir: '@/components/ui'
  },
  colorMode: {
    preference: 'system', // Default preference
    fallback: 'light',    // Fallback when system preference isn't available
    globalName: '__NUXT_COLOR_MODE__',
    componentName: 'ColorScheme',
    classPrefix: '',
    classSuffix: '',      // Important for Tailwind dark mode
    dataValue: '',        // Use class-based dark mode instead of data attribute
    storage: 'sessionStorage', // Match theme manager's sessionStorage
    storageKey: 'nuxt-color-mode'
  },
  runtimeConfig: {
    retellAgentId: '',
    retellStartCallWebhookUrl: '',
    retellStartCallWebhookToken: '',
    stripeSecretKey: '',
    stripeWebhookSecret: '',
    n8nFulfillmentWebhookUrl: '',
    n8nFulfillmentWebhookToken: '',
    n8nAskDonWebhookUrl: '',
    videoToTextWebhookUrl: '',
    videoToTextApiKey: '',
    videoToTextCallbackUrl: '',
    public: {
      stripePublishableKey: '',
      siteUrl: '',
    },
  },
  security: {
    headers: {
      contentSecurityPolicy: {
        'img-src': ["'self'", 'data:', 'blob:', 'https://cdn.simpleicons.org', 'https://*.stripe.com'],
        'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://js.stripe.com'],
        'style-src': ["'self'", "'unsafe-inline'"],
        'frame-src': [
          "'self'",
          'https://js.stripe.com',
          'https://hooks.stripe.com',
          'https://www.youtube.com',
          'https://www.youtube-nocookie.com',
        ],
        'connect-src': [
          "'self'",
          'https://api.iconify.design',
          'https://api.stripe.com',
          'https://r.stripe.com',
          'https://m.stripe.network',
          'https://*.livekit.cloud',
          'wss://*.livekit.cloud',
        ],
      },
      permissionsPolicy: {
        camera: [],
        'display-capture': [],
        fullscreen: ['self'],
        geolocation: [],
        microphone: ['self'],
      },
    }
  },
  build: {
    // transpile: ['vee-validate', 'vue-sonner'],
  },
 
  
})
