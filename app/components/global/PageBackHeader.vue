<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  to?: string
}>(), {
  to: '/',
})
</script>

<template>
  <NuxtLink
    :to="to"
    class="inline-flex items-center gap-2 text-[#f0deca] transition-colors hover:text-[#fff4e6]"
  >
    <Icon name="lucide:chevron-left" class="size-4" />
    <h1 class="text-[2rem] leading-none font-semibold tracking-tight">
      {{ title }}
    </h1>
  </NuxtLink>
</template>
