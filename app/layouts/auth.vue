<template>
  <div
    data-slot="layout"
    class="theme-container relative min-h-screen bg-background text-foreground transition-colors duration-300"
  >
    <div
      class="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_12%_10%,rgba(216,132,90,0.16),transparent_20%),radial-gradient(circle_at_88%_14%,rgba(251,223,108,0.12),transparent_18%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0))]"
    />

    <div data-wrapper class="relative min-h-screen w-full overflow-x-hidden">
      <ClientOnly>
        <NeonCursor />
      </ClientOnly>

      <main class="w-full overflow-x-hidden">
        <NuxtPage />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import NeonCursor from '~/components/ui/neon-cursor/NeonCursor.vue'

useLayoutManager()
</script>
