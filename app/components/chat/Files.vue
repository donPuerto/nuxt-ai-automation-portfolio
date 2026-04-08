<script setup lang="ts">
import type { FileWithStatus } from '@/composables/useFileUpload'

defineProps<{
  files: FileWithStatus[]
}>()

defineEmits<{
  remove: [id: string]
}>()
</script>

<template>
  <ChatFiles :files="files" @remove="$emit('remove', $event)" />
</template>
