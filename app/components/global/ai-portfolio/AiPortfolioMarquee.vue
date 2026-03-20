<script setup lang="ts">
import type { AiPortfolioMarqueeItem } from '@@/shared'

defineProps<{
  items: readonly AiPortfolioMarqueeItem[]
}>()

const emit = defineEmits<{
  select: [item: AiPortfolioMarqueeItem]
}>()
</script>

<template>
  <div class="relative overflow-hidden rounded-full border border-border/60 bg-background/55 px-3 py-2 shadow-sm backdrop-blur">
    <div class="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background via-background/80 to-transparent" />
    <div class="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background via-background/80 to-transparent" />

    <div class="flex min-w-max animate-[marquee_34s_linear_infinite] gap-3 hover:[animation-play-state:paused]">
      <button
        v-for="item in [...items, ...items]"
        :key="`${item.id}-${item.prompt}`"
        type="button"
        class="shrink-0 rounded-full border border-border/60 bg-card/70 px-4 py-2 text-sm text-muted-foreground transition hover:border-primary/35 hover:text-foreground"
        @click="emit('select', item)"
      >
        <span class="font-medium text-foreground">{{ item.label }}</span>
        <span class="mx-2 text-muted-foreground/50">·</span>
        <span>{{ item.description }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
@keyframes marquee {
  0% {
    transform: translateX(-25%);
  }

  100% {
    transform: translateX(0%);
  }
}
</style>
