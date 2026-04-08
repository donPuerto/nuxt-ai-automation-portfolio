<script setup lang="ts">
import type { AiPortfolioPromptAgentOption } from '@@/shared/pages/ai-portfolio'
import type { ChatFileWithStatus } from './chat-types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const modelValue = defineModel<string>({ default: '' })

const props = defineProps<{
  loading?: boolean
  agentLabel?: string
  agentDescription?: string
  selectedAgentId?: string
  agentOptions?: AiPortfolioPromptAgentOption[]
}>()

const emit = defineEmits<{
  submit: [payload: { files: ChatFileWithStatus[] }]
  selectAgent: [agentId: string]
}>()

const isInputFocused = ref(false)
const hasValue = computed(() => modelValue.value.trim().length > 0)
const {
  dropzoneRef,
  dragging,
  files: attachedFiles,
  addFiles,
  removeFile,
} = useFileUpload()

const selectedAgent = computed(() => {
  if (!props.agentOptions?.length) {
    return null
  }

  return props.agentOptions.find(option => option.id === props.selectedAgentId) ?? props.agentOptions[0]
})

const visibleAgentLabel = computed(() => selectedAgent.value?.label || props.agentLabel || 'Local portfolio agent')
const visibleAgentDescription = computed(() => selectedAgent.value?.description || props.agentDescription || '')
const selectableAgents = computed(() => props.agentOptions?.filter(option => option.available) ?? [])

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Enter' || !event.altKey) {
    return
  }

  event.preventDefault()
  emit('submit', { files: [...attachedFiles.value] })
}

const handleAgentChange = (value: unknown) => {
  if (typeof value !== 'string' || !value) {
    return
  }

  emit('selectAgent', value)
}

const handleFocus = () => {
  isInputFocused.value = true
}

const handleBlur = () => {
  isInputFocused.value = false
}
</script>

<template>
  <div
    ref="dropzoneRef"
    class="relative rounded-[1rem] border border-border/80 bg-background/94 px-5 py-4 shadow-[0_30px_70px_-36px_rgba(0,0,0,0.22),0_12px_28px_-18px_rgba(0,0,0,0.12)] backdrop-blur-md dark:border-white/8 dark:bg-[#2d2c29]/92 dark:shadow-[0_28px_70px_-48px_rgba(0,0,0,0.95)] md:px-6"
  >
    <DragDropOverlay :show="dragging" />

    <div class="flex min-h-[4.9rem] flex-col justify-between gap-2.5 md:min-h-[5.1rem]">
      <div v-if="attachedFiles.length" class="border-b border-border/60 pb-3">
        <Files
          :files="attachedFiles"
          @remove="removeFile"
        />
      </div>

      <div class="relative flex-1 overflow-hidden px-1 py-1">
        <div
          v-if="!hasValue"
          class="pointer-events-none absolute inset-x-1 top-1 flex items-center text-base leading-6 text-muted-foreground/90 dark:text-[#d1ccc4]/78"
        >
          <span>Type your message here...</span>
        </div>

        <Textarea
          v-model="modelValue"
          placeholder=""
          rows="1"
          class="min-h-[1.9rem] resize-none border-0 !bg-transparent px-0 py-0 text-base leading-6 text-foreground shadow-none focus-visible:border-transparent focus-visible:ring-0 dark:!bg-transparent dark:text-[#f3efe9]"
          @keydown="handleKeydown"
          @focus="handleFocus"
          @blur="handleBlur"
        />
      </div>

      <div class="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 text-muted-foreground dark:text-[#d1ccc4]/78">
        <div class="flex min-w-0 items-center gap-2 text-sm">
          <FileUploadButton :disabled="loading" @files="addFiles" />
          <span class="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground/85">AI</span>
          <Select :model-value="selectedAgentId" @update:model-value="handleAgentChange">
            <SelectTrigger
              size="sm"
              class="h-8 min-w-0 border-0 bg-transparent px-0 text-[14px] font-medium text-foreground shadow-none hover:bg-transparent focus:ring-0 focus:ring-offset-0 dark:bg-transparent"
              :title="visibleAgentDescription || undefined"
            >
              <SelectValue :placeholder="visibleAgentLabel" class="truncate" />
            </SelectTrigger>
            <SelectContent class="rounded-2xl border-border/80 bg-background/96 dark:bg-[#2f2d29]/98">
              <SelectItem
                v-for="option in selectableAgents"
                :key="option.id"
                :value="option.id"
                class="rounded-xl px-3 py-2.5"
                :title="option.description"
              >
                <span class="block truncate">{{ option.label }}</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="flex min-w-0 flex-1 items-center justify-end gap-2 text-sm sm:flex-initial">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            class="size-8 rounded-md border border-border/70 bg-background/40 text-foreground shadow-none hover:bg-accent hover:text-accent-foreground dark:bg-white/[0.02]"
            :class="isInputFocused ? 'border-primary/70 bg-primary/10 text-primary' : ''"
            :disabled="loading || !hasValue"
            @click="emit('submit', { files: [...attachedFiles] })"
          >
            <Icon v-if="loading" name="lucide:loader-circle" class="size-5 animate-spin" />
            <Icon v-else name="lucide:arrow-up" class="size-4" />
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
