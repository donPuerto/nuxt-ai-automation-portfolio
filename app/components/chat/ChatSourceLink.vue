<script setup lang="ts">
const props = defineProps<{
  href: string
  label?: string
}>()

const hostname = computed(() => {
  try {
    return new URL(props.href).hostname.replace(/^www\./, '')
  }
  catch {
    return props.href
  }
})
</script>

<template>
  <a
    :href="href"
    target="_blank"
    rel="noopener noreferrer"
    class="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/35 px-3 py-1 text-xs text-foreground/85 transition hover:bg-muted/60"
  >
    <Icon name="lucide:link-2" class="size-3.5" />
    <span class="truncate">{{ label || hostname }}</span>
    <Icon name="lucide:arrow-up-right" class="size-3" />
  </a>
</template>
