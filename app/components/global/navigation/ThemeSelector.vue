<template>
  <Button
    variant="ghost"
    size="icon"
    class="size-11 rounded-full border border-border/50 bg-background/75 p-0 text-foreground shadow-sm backdrop-blur-md transition-[background-color,color,border-color,box-shadow] hover:bg-accent/85 hover:text-accent-foreground dark:bg-background/65"
    aria-label="Toggle theme"
    @click="toggleTheme($event)"
  >
    <span class="relative flex size-8 items-center justify-center">
      <Icon
        name="lucide:sun-medium"
        class="absolute size-8 rotate-0 scale-100 opacity-100 transition-all duration-300 dark:rotate-90 dark:scale-0 dark:opacity-0"
      />
      <Icon
        name="lucide:moon-star"
        class="absolute size-8 -rotate-90 scale-0 opacity-0 transition-all duration-300 dark:rotate-0 dark:scale-100 dark:opacity-100"
      />
    </span>
  </Button>
</template>

<script setup lang="ts">
const { toggleTheme } = useTheme()
</script>
