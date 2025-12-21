import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/tailwind.css'],
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
    },
  },
  vite: {
    plugins: [
      tsconfigPaths(),
      tailwindcss(),
    ],
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
    storage: 'localStorage', // or 'sessionStorage' or 'cookie'
    storageKey: 'nuxt-color-mode'
  },
  build: {
    // transpile: ['vee-validate', 'vue-sonner'],
  },
 
  
})