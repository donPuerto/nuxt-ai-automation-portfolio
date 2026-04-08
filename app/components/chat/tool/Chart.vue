<script setup lang="ts">
defineProps<{
  title?: string
  description?: string
}>()
</script>

<template>
  <Card class="border-border/70 bg-card/80">
    <CardHeader class="pb-2">
      <CardTitle class="text-sm">{{ title || 'Chart result' }}</CardTitle>
      <CardDescription>{{ description || 'Chart preview is not connected yet.' }}</CardDescription>
    </CardHeader>
    <CardContent>
      <div class="h-32 rounded-md border border-dashed border-border/70 bg-muted/40" />
    </CardContent>
  </Card>
</template>
