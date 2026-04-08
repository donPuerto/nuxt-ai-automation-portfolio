<script setup lang="ts">
const props = defineProps<{
  items: string[]
}>()

const duplicatedItems = computed(() => [...props.items, ...props.items])
</script>

<template>
  <div class="relative overflow-hidden rounded-lg border border-border/70 bg-background/40">
    <div class="pointer-events-none absolute inset-y-0 left-0 z-10 w-14 bg-gradient-to-r from-background to-transparent" />
    <div class="pointer-events-none absolute inset-y-0 right-0 z-10 w-14 bg-gradient-to-l from-background to-transparent" />

    <div class="stack-rail-track flex w-max items-center gap-3 px-3 py-3">
      <div
        v-for="(item, index) in duplicatedItems"
        :key="`${item}-${index}`"
        class="whitespace-nowrap rounded-md border border-border/70 bg-muted/30 px-3 py-1.5 text-sm text-foreground/88"
      >
        {{ item }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.stack-rail-track {
  animation: stack-rail-scroll 28s linear infinite;
}

@keyframes stack-rail-scroll {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}
</style>
