<script setup lang="ts">
defineProps<{
  content: string
}>()
</script>

<template>
  <div class="prose prose-sm max-w-none text-foreground dark:prose-invert">
    <p class="whitespace-pre-wrap">{{ content }}</p>
  </div>
</template>
