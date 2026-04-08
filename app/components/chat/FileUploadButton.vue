<script setup lang="ts">
defineProps<{
  disabled?: boolean
}>()

defineEmits<{
  files: [files: File[]]
}>()
</script>

<template>
  <ChatFileUploadButton :disabled="disabled" @files="$emit('files', $event)" />
</template>
