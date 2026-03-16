<script setup lang="ts">
const props = defineProps<{
  url: string
  title: string
}>()

const embedUrl = computed(() => {
  const match = props.url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([A-Za-z0-9_-]{11})/,
  )

  if (!match) {
    return null
  }

  return `https://www.youtube.com/embed/${match[1]}`
})
</script>

<template>
  <div class="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
    <div v-if="embedUrl" class="aspect-video">
      <iframe
        :src="embedUrl"
        :title="title"
        class="h-full w-full"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
      />
    </div>
    <div v-else class="flex aspect-video items-center justify-center bg-muted/40 px-6 text-center text-sm text-muted-foreground">
      Add a valid YouTube URL in the shared project content to render the demo here.
    </div>
  </div>
</template>
