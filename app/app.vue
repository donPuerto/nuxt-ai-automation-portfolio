<template>
  <NuxtLayout>
    <!-- Markup shared across all pages, ex: NavBar -->
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
// Initialize layout manager globally to ensure it applies to all pages
const { isLayoutFixed } = useLayoutManager()
</script>
