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
</script>
