<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <section class="space-y-4">
    <div class="space-y-2">
      <p class="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
        {{ title }}
      </p>
      <slot name="header" />
    </div>
    <slot />
  </section>
</template>
