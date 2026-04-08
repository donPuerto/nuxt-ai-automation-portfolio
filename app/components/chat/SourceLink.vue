<script setup lang="ts">
defineProps<{
  href: string
  label?: string
}>()
</script>

<template>
  <ChatSourceLink :href="href" :label="label" />
</template>
