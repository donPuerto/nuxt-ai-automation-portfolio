<template>
  <Button
    variant="ghost"
    size="icon"
    class="h-8 w-8 text-foreground/70 shadow-none hover:bg-accent hover:text-accent-foreground"
    aria-label="Toggle theme"
    @click="toggleTheme($event)"
  >
    <span class="relative flex size-3.5 items-center justify-center">
      <Icon
        name="lucide:sun-medium"
        class="absolute size-3.5 rotate-0 scale-100 opacity-100 transition-all duration-300 dark:rotate-90 dark:scale-0 dark:opacity-0"
      />
      <Icon
        name="lucide:moon-star"
        class="absolute size-3.5 -rotate-90 scale-0 opacity-0 transition-all duration-300 dark:rotate-0 dark:scale-100 dark:opacity-100"
      />
    </span>
  </Button>
</template>

<script setup lang="ts">
const { toggleTheme } = useTheme()
</script>
