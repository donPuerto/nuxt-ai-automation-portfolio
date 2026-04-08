<script setup lang="ts">
const modelValue = defineModel<'private' | 'public'>({ default: 'private' })
</script>

<template>
  <div class="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/30 p-1 text-xs">
    <Button
      type="button"
      size="sm"
      variant="ghost"
      class="h-7 rounded-full px-3 text-xs"
      :class="modelValue === 'private' ? 'bg-background text-foreground' : 'text-muted-foreground'"
      @click="modelValue = 'private'"
    >
      Private
    </Button>
    <Button
      type="button"
      size="sm"
      variant="ghost"
      class="h-7 rounded-full px-3 text-xs"
      :class="modelValue === 'public' ? 'bg-background text-foreground' : 'text-muted-foreground'"
      @click="modelValue = 'public'"
    >
      Public
    </Button>
  </div>
</template>
