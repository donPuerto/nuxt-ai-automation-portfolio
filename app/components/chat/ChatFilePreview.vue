<script setup lang="ts">
import type { ChatFileStatus } from './chat-types'
import { getFileIcon, removeRandomSuffix } from './chat-file-utils'

const props = withDefaults(defineProps<{
  name: string
  type?: string
  previewUrl?: string
  status?: ChatFileStatus
  error?: string
  removable?: boolean
}>(), {
  status: 'ready',
  removable: false,
})

const emit = defineEmits<{
  remove: []
}>()

const isImage = computed(() => props.type?.startsWith('image/') && Boolean(props.previewUrl))
const statusLabel = computed(() => {
  if (props.status === 'uploading') return 'Uploading'
  if (props.status === 'processing') return 'Processing'
  if (props.status === 'error') return props.error || 'Failed'
  return 'Ready'
})
</script>

<template>
  <div class="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/50 px-2 py-1.5 text-xs text-foreground/85">
    <div
      class="inline-flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-background/80"
    >
      <img
        v-if="isImage && previewUrl"
        :src="previewUrl"
        :alt="name"
        class="size-full object-cover"
      >
      <Icon
        v-else
        :name="getFileIcon(type)"
        class="size-3.5 text-muted-foreground"
      />
    </div>

    <div class="min-w-0">
      <p class="max-w-[9rem] truncate font-medium">{{ removeRandomSuffix(name) }}</p>
      <p class="text-[10px] text-muted-foreground">{{ statusLabel }}</p>
    </div>

    <Button
      v-if="removable"
      type="button"
      variant="ghost"
      size="icon"
      class="size-5 rounded-full hover:bg-accent"
      aria-label="Remove file"
      @click="emit('remove')"
    >
      <Icon name="lucide:x" class="size-3" />
    </Button>
  </div>
</template>
