<script setup lang="ts">
const props = defineProps<{
  title: string
  src: string
  mediaKind: 'audio' | 'video'
}>()

const playerClass = computed(() => {
  return props.mediaKind === 'video'
    ? 'aspect-video w-full overflow-hidden rounded-[1.5rem] border border-border/70 bg-black text-white'
    : 'w-full overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/70 text-white'
})
</script>

<template>
  <ClientOnly>
    <media-player
      :title="title"
      :src="src"
      :view-type="mediaKind"
      stream-type="on-demand"
      load="visible"
      playsinline
      crossorigin
      class="not-prose block"
      :class="playerClass"
    >
      <media-outlet />
      <media-community-skin />
    </media-player>

    <template #fallback>
      <div class="flex h-[16rem] items-center justify-center px-6 text-center text-sm text-muted-foreground">
        Loading media preview...
      </div>
    </template>
  </ClientOnly>
</template>
