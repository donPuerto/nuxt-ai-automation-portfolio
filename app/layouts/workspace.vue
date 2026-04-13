<script setup lang="ts">
const route = useRoute()

const shellMode = computed<'prompt' | 'settings'>(() => {
  if (route.path.startsWith('/settings')) {
    return 'settings'
  }

  return 'prompt'
})

useLayoutManager()
</script>

<template>
  <div
    data-slot="layout"
    class="theme-container relative min-h-screen bg-background text-foreground transition-colors duration-300"
  >
    <ChatShell :mode="shellMode">
      <slot />
    </ChatShell>
  </div>
</template>
