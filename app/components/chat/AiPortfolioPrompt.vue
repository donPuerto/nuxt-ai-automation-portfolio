<script setup lang="ts">
import type { AiPortfolioPromptAgentOption } from '@@/shared/pages/ai-portfolio'
import type { ChatFileWithStatus } from './chat-types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import DragDropOverlay from './DragDropOverlay.vue'
import FileUploadButton from './FileUploadButton.vue'
import Files from './Files.vue'

const modelValue = defineModel<string>({ default: '' })

const props = defineProps<{
  loading?: boolean
  agentLabel?: string
  agentDescription?: string
  selectedAgentId?: string
  agentOptions?: AiPortfolioPromptAgentOption[]
  isAuthenticated?: boolean
}>()

const emit = defineEmits<{
  submit: [payload: { files: ChatFileWithStatus[] }]
  selectAgent: [agentId: string]
  addAgent: []
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

const selectedProvider = ref<'openrouter' | 'claude' | 'openai'>('openrouter')

const visibleAgentLabel = computed(() => selectedAgent.value?.label || props.agentLabel || 'Local portfolio agent')
const visibleAgentDescription = computed(() => selectedAgent.value?.description || props.agentDescription || '')
const selectableAgents = computed(() => props.agentOptions?.filter(option => option.available) ?? [])
const filteredSelectableAgents = computed(() => {
  return selectableAgents.value.filter(option => option.provider === selectedProvider.value)
})
const canUseAgent = (option: AiPortfolioPromptAgentOption) => {
  return option.available && (!option.requiresAuth || props.isAuthenticated)
}

const providerMenu = [
  { key: 'openrouter', label: 'OpenRouter', icon: 'lucide:orbit' },
  { key: 'claude', label: 'Claude', icon: 'lucide:sparkles' },
  { key: 'openai', label: 'OpenAI', icon: 'lucide:cpu' },
] as const

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Enter' || !event.ctrlKey) {
    return
  }

  event.preventDefault()
  emit('submit', { files: [...attachedFiles.value] })
}

const handleAgentChange = (value: unknown) => {
  if (typeof value !== 'string' || !value) {
    return
  }

  const option = props.agentOptions?.find(item => item.id === value)
  if (!option || !canUseAgent(option)) {
    return
  }

  emit('selectAgent', value)
}

const handleProviderChange = (provider: 'openrouter' | 'claude' | 'openai') => {
  selectedProvider.value = provider
  const firstProviderModel = selectableAgents.value.find(option => option.provider === provider && canUseAgent(option))
  if (firstProviderModel && firstProviderModel.id !== props.selectedAgentId) {
    emit('selectAgent', firstProviderModel.id)
  }
}

const handleFocus = () => {
  isInputFocused.value = true
}

const handleBlur = () => {
  isInputFocused.value = false
}

watch(selectedAgent, (agent) => {
  if (!agent?.provider) {
    return
  }

  selectedProvider.value = agent.provider
}, { immediate: true })
</script>

<template>
  <div
    ref="dropzoneRef"
    class="relative rounded-[1rem] border border-border/80 bg-card/94 px-5 py-4 shadow-[0_30px_70px_-36px_rgba(0,0,0,0.22),0_12px_28px_-18px_rgba(0,0,0,0.12)] backdrop-blur-md md:px-6"
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
          class="pointer-events-none absolute inset-x-1 top-1 flex items-center text-base leading-6 text-muted-foreground/90"
        >
          <span>Type your message here...</span>
        </div>

        <Textarea
          v-model="modelValue"
          placeholder=""
          rows="1"
          class="min-h-[1.9rem] resize-none border-0 !bg-transparent px-0 py-0 text-base leading-6 text-foreground shadow-none focus-visible:border-transparent focus-visible:ring-0"
          @keydown="handleKeydown"
          @focus="handleFocus"
          @blur="handleBlur"
        />
      </div>

      <div class="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 text-muted-foreground">
        <div class="flex min-w-0 items-center gap-2 text-sm">
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                class="size-7 rounded-full text-muted-foreground hover:text-foreground"
                title="Switch provider"
              >
                <Icon name="lucide:plus" class="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" class="min-w-[10rem]">
              <DropdownMenuLabel class="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                Providers
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                v-for="provider in providerMenu"
                :key="provider.key"
                class="cursor-pointer"
                @click="handleProviderChange(provider.key)"
              >
                <span class="flex w-full items-center justify-between gap-2">
                  <span class="flex items-center gap-2">
                    <Icon :name="provider.icon" class="size-3.5 text-muted-foreground" />
                    <span>{{ provider.label }}</span>
                  </span>
                  <Icon
                    v-if="selectedProvider === provider.key"
                    name="lucide:check"
                    class="size-3.5"
                  />
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <FileUploadButton :disabled="loading" @files="addFiles" />
          <span class="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground/85">AI</span>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button
                type="button"
                variant="ghost"
                class="h-8 min-w-0 max-w-[18rem] gap-1 rounded-md px-0 text-[14px] font-medium text-foreground hover:bg-transparent hover:text-foreground"
                :title="visibleAgentDescription || undefined"
              >
                <span class="truncate">{{ visibleAgentLabel }}</span>
                <Icon name="lucide:chevron-down" class="size-4 shrink-0 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" class="min-w-[18rem] max-w-[22rem]">
              <DropdownMenuLabel class="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                Models · input / output USD per 1M
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                v-for="option in filteredSelectableAgents"
                :key="option.id"
                class="cursor-pointer py-2"
                :title="option.description"
                :disabled="!canUseAgent(option)"
                @click="handleAgentChange(option.id)"
              >
                <span class="flex w-full items-center justify-between gap-2">
                  <span class="min-w-0">
                    <span class="flex min-w-0 items-center gap-2">
                      <span class="block truncate text-[14px]">{{ option.label }}</span>
                      <span
                        v-if="option.requiresAuth"
                        class="rounded-sm bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-primary"
                      >
                        Premium
                      </span>
                    </span>
                    <span class="block truncate text-[10px] tracking-normal text-muted-foreground/80">
                      {{ option.requiresAuth && !isAuthenticated ? 'Sign in to use · ' : '' }}{{ option.costLabel || 'Pricing unavailable' }}
                    </span>
                  </span>
                  <Icon
                    v-if="selectedAgentId === option.id"
                    name="lucide:check"
                    class="size-3.5 shrink-0"
                  />
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                v-if="!filteredSelectableAgents.length"
                disabled
              >
                No models available for this provider
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div class="flex min-w-0 flex-1 items-center justify-end gap-2 text-sm sm:flex-initial">
          <Button
            type="button"
            size="icon"
            variant="default"
            class="size-8 rounded-xl bg-primary text-primary-foreground shadow-none hover:bg-primary/90"
            :class="isInputFocused ? 'ring-2 ring-primary/35 ring-offset-0' : ''"
            :disabled="loading || !hasValue"
            title="Send (Ctrl + Enter)"
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
