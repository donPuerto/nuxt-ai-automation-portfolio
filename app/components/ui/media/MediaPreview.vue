<script setup lang="ts">
const props = defineProps<{
  title: string
  src: string
  mediaKind: 'audio' | 'video'
}>()

const containerClass = computed(() => {
  return props.mediaKind === 'video'
    ? 'aspect-video w-full overflow-hidden rounded-[1.5rem] border border-border/70 bg-black text-white'
    : 'w-full overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/70 text-white p-3'
})
</script>

<template>
  <div class="not-prose block" :class="containerClass">
    <video
      v-if="mediaKind === 'video'"
      :title="title"
      :src="src"
      controls
      playsinline
      preload="metadata"
      class="h-full w-full bg-black"
    >
      Your browser could not play this video.
    </video>

    <audio
      v-else
      :title="title"
      :src="src"
      controls
      preload="metadata"
      class="w-full"
    >
      Your browser could not play this audio.
    </audio>
  </div>
</template>
