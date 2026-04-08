<script setup lang="ts">
defineProps<{
  location?: string
  summary?: string
}>()
</script>

<template>
  <Card class="border-border/70 bg-card/80">
    <CardHeader class="pb-2">
      <CardTitle class="text-sm">{{ location || 'Weather' }}</CardTitle>
      <CardDescription>{{ summary || 'Weather tool response placeholder.' }}</CardDescription>
    </CardHeader>
  </Card>
</template>
