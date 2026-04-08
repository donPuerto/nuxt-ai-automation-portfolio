<script setup lang="ts">
defineProps<{
  sources: Array<{ href: string, label?: string }>
}>()
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <SourceLink
      v-for="source in sources"
      :key="source.href"
      :href="source.href"
      :label="source.label"
    />
  </div>
</template>
