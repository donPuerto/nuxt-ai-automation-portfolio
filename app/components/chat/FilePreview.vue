<script setup lang="ts">
import type { ChatFileStatus } from './chat-types'

defineProps<{
  name: string
  type?: string
  previewUrl?: string
  status?: ChatFileStatus
  error?: string
  removable?: boolean
}>()

defineEmits<{
  remove: []
}>()
</script>

<template>
  <ChatFilePreview
    :name="name"
    :type="type"
    :preview-url="previewUrl"
    :status="status"
    :error="error"
    :removable="removable"
    @remove="$emit('remove')"
  />
</template>
