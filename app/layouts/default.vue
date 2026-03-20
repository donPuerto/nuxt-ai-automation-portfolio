<template>
  <div
    data-slot="layout"
    :class="[
      'theme-container relative min-h-screen text-foreground transition-colors duration-300',
      isAiHome ? 'bg-transparent' : 'bg-background/92 dark:bg-background/70',
    ]"
  >
    <!-- Neural Background Layer -->
    <ClientOnly>
      <AsyncNeuralBg class="fixed inset-0 -z-10" :hue="200" :saturation="0.8" :chroma="0.6" />
    </ClientOnly>
    
    <!-- Subtle Gradient Overlay -->
    <div
      v-if="!isAiHome"
      class="pointer-events-none fixed inset-0 -z-5 bg-linear-to-br from-white/65 via-white/25 to-slate-200/40 dark:from-blue-500/5 dark:via-purple-500/5 dark:to-pink-500/5"
    />

    <div data-wrapper class="relative mx-auto w-full overflow-x-hidden">
      <ClientOnly>
        <FluidCursor />
      </ClientOnly>

      <Navigation v-if="!isAiHome" />

      <main class="w-full overflow-x-hidden">
        <NuxtPage />
      </main>

      <BackToTop />
    </div>

    <Footer v-if="!isAiHome" />
</div>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const AsyncNeuralBg = defineAsyncComponent(() => import('~/components/ui/bg-neural/NeuralBg.vue'))
const route = useRoute()
const isAiHome = computed(() => route.path === '/')

useLayoutManager()
useColorMode()
</script>
