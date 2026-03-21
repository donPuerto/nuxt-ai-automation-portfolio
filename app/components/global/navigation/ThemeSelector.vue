<template>
  <Button
    variant="ghost"
    size="icon"
    class="size-12 rounded-full border-0 bg-transparent p-0 shadow-none transition-colors"
    :class="triggerClasses"
    :aria-label="displayMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
    @click="toggleTheme($event)"
  >
    <Icon
      :name="displayMode === 'dark' ? 'lucide:moon-star' : displayMode === 'light' ? 'lucide:sun-medium' : 'lucide:sun-moon'"
      class="size-7"
    />
  </Button>
</template>

<script setup lang="ts">
const { colorMode, toggleTheme } = useTheme()
const isMounted = ref(false)

onMounted(() => {
  isMounted.value = true
})

const displayMode = computed<'light' | 'dark' | 'system'>(() => {
  if (!isMounted.value) {
    return 'system'
  }

  return colorMode.value === 'dark' ? 'dark' : 'light'
})

const triggerClasses = computed(() => {
  if (displayMode.value === 'light') {
    return 'text-[#111111] hover:bg-black/[0.08] hover:text-black'
  }

  if (displayMode.value === 'dark') {
    return 'text-white hover:bg-white/[0.08] hover:text-white'
  }

  return 'text-white/92 hover:bg-white/[0.08] hover:text-white'
})
</script>
