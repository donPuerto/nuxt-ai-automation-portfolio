<template>
  <div data-slot="layout" class="min-h-screen">
    <div data-wrapper class="mx-auto w-full">
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