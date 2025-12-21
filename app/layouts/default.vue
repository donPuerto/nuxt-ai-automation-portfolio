<template>
  <div class="min-h-screen">
    <ClientOnly>
      <FluidCursor />
    </ClientOnly>

    <Navigation />

    <main>
      <NuxtPage />
    </main>

    <Footer />

    <BackToTop />
  </div>
</template>

<script setup lang="ts">
// Components are auto-imported
</script>