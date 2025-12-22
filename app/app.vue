<template>
  <div>
    <NuxtLayout>
      <!-- Markup shared across all pages, ex: NavBar -->
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
// Initialize layout manager globally to ensure it applies to all pages
const { isLayoutFixed } = useLayoutManager()

// Ensure color mode is initialized
const colorMode = useColorMode()

// Add font preload and prevent FOUC
useHead({
  htmlAttrs: {
    class: 'antialiased',
    style: 'visibility: visible !important;'
  },
  bodyAttrs: {
    class: 'antialiased',
    style: 'visibility: visible !important;'
  },
  link: [
    {
      rel: 'preconnect',
      href: 'https://fonts.googleapis.com'
    },
    {
      rel: 'preconnect',
      href: 'https://fonts.gstatic.com',
      crossorigin: 'anonymous'
    }
  ],
  style: [
    {
      children: `html,body{visibility:visible!important;font-family:system-ui,Arial,sans-serif;background-color:hsl(var(--background,0 0% 100%));color:hsl(var(--foreground,0 0% 3.9%));}`,
      type: 'text/css',
      key: 'critical-css'
    }
  ]
})
</script>
