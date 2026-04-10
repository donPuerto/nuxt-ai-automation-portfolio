<template>
  <div
    data-slot="layout"
    class="theme-container relative min-h-screen bg-background text-foreground transition-colors duration-300"
  >
    <div
      class="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_0%_7%,rgba(250,223,110,0.34),transparent_11%),radial-gradient(circle_at_32%_0%,rgba(251,223,108,0.26),transparent_12%),radial-gradient(circle_at_50%_26%,rgba(162,205,255,0.12),transparent_16%),linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0))] dark:hidden"
    />

    <div data-wrapper class="relative mx-auto w-full overflow-x-hidden">
      <ClientOnly>
        <NeonCursor />
      </ClientOnly>

      <Navigation v-if="!isAiHome" />

      <main class="w-full overflow-x-hidden">
        <slot />
      </main>

      <BackToTop />
    </div>

    <Footer v-if="!isAiHome" />
  </div>
</template>

<script setup lang="ts">
import NeonCursor from '~/components/ui/neon-cursor/NeonCursor.vue'

const route = useRoute()
const isAiHome = computed(() => route.path === '/')

useLayoutManager()
</script>
