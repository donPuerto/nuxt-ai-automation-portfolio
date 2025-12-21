<template>
  <div data-slot="layout" class="relative min-h-screen">
    <!-- Gradient Background Layer -->
    <div class="fixed inset-0 -z-20 bg-linear-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20" />
    
    <!-- Neural Background Layer -->
    <ClientOnly>
      <NeuralBg class="fixed inset-0 -z-10" :hue="200" :saturation="0.8" :chroma="0.6" />
    </ClientOnly>

    <div data-wrapper class="relative mx-auto w-full">
      <ClientOnly>
        <FluidCursor />
      </ClientOnly>

      <Navigation />

      <main class="w-full">
        <NuxtPage />
      </main>

      <Footer />

      <BackToTop />
    </div>
  </div>
</template>

<script setup lang="ts">
// Ensure layout manager is accessible in the layout
const { isLayoutFixed } = useLayoutManager()
</script>