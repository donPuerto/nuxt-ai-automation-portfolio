<script setup lang="ts">
import type {
  AiPortfolioPromptAgentOption,
  AiPortfolioPromptMenuItem,
} from '@@/shared/pages/ai-portfolio'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const modelValue = defineModel<string>({ default: '' })

const props = defineProps<{
  loading?: boolean
  agentLabel?: string
  agentDescription?: string
  selectedAgentId?: string
  agentOptions?: AiPortfolioPromptAgentOption[]
  toolMenu?: AiPortfolioPromptMenuItem[]
}>()

const emit = defineEmits<{
  submit: []
}>()

const hasValue = computed(() => modelValue.value.trim().length > 0)

const selectedAgent = computed(() => {
  if (!props.agentOptions?.length) {
    return null
  }

  return props.agentOptions.find(option => option.id === props.selectedAgentId) ?? props.agentOptions[0]
})

const visibleAgentLabel = computed(() => selectedAgent.value?.label || props.agentLabel || 'Local portfolio agent')
const visibleAgentDescription = computed(() => selectedAgent.value?.description || props.agentDescription || '')

const hasChildren = (item: AiPortfolioPromptMenuItem) => !!item.children?.length

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Enter' || event.shiftKey) {
    return
  }

  event.preventDefault()
  emit('submit')
}
</script>

<template>
  <div class="rounded-[1.75rem] border border-white/8 bg-[#2d2c29]/92 px-5 py-5 shadow-[0_28px_70px_-48px_rgba(0,0,0,0.95)] backdrop-blur-sm md:px-6">
    <div class="flex min-h-[6.8rem] flex-col justify-between gap-5 md:min-h-[7rem]">
      <div class="relative flex-1 overflow-hidden px-1 py-1">
        <div
          v-if="!hasValue"
          class="pointer-events-none absolute inset-x-1 top-1 flex items-center text-[1.02rem] leading-7 text-[#d1ccc4]/78 md:text-[1.08rem]"
        >
          <span>Ask about my projects, workflows, or services...</span>
        </div>

        <Textarea
          v-model="modelValue"
          placeholder=""
          rows="2"
          class="min-h-[3rem] resize-none border-0 !bg-transparent dark:!bg-transparent px-0 py-0 text-[1.02rem] leading-7 text-[#f3efe9] shadow-none focus-visible:border-transparent focus-visible:ring-0 md:text-[1.08rem]"
          @keydown="handleKeydown"
        />
      </div>

      <div class="flex items-center justify-between gap-4 border-t border-white/8 pt-3 text-[#d1ccc4]/78">
        <div class="flex items-center gap-2.5 text-sm">
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <button
                type="button"
                class="inline-flex size-8 items-center justify-center rounded-full text-[#d1ccc4]/82 transition hover:bg-white/[0.05] hover:text-[#f3efe9]"
                aria-label="Prompt tools"
              >
                <Icon name="lucide:plus" class="size-4" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="start"
              side="top"
              :side-offset="12"
              class="w-[18rem] rounded-2xl border-white/10 bg-[#2f2d29]/98 p-2 text-[#f1ece4] shadow-[0_32px_80px_-40px_rgba(0,0,0,0.95)] backdrop-blur-xl"
            >
              <template v-for="item in toolMenu" :key="item.id">
                <DropdownMenuSeparator
                  v-if="item.type === 'separator'"
                  class="my-1 bg-white/8"
                />

                <DropdownMenuSub v-else-if="item.type === 'submenu' && hasChildren(item)">
                  <DropdownMenuSubTrigger
                    class="rounded-xl px-3 py-2.5 text-[0.95rem] text-[#f1ece4] hover:bg-white/[0.04] focus:bg-white/[0.06] data-[disabled]:text-[#a59d92]/45"
                    :disabled="item.disabled"
                  >
                    <span class="inline-flex size-4 items-center justify-center shrink-0">
                      <Icon v-if="item.icon" :name="item.icon" class="size-4 text-[#cfc8be]" />
                    </span>
                    <span class="flex-1 truncate text-left">{{ item.label }}</span>
                    <span
                      v-if="item.badge"
                      class="mr-2 rounded-full border border-white/10 px-2 py-0.5 text-[0.64rem] uppercase tracking-[0.18em] text-[#c8c1b6]/80"
                    >
                      {{ item.badge }}
                    </span>
                  </DropdownMenuSubTrigger>

                  <DropdownMenuSubContent
                    :side-offset="10"
                    class="z-[90] w-56 rounded-2xl border-white/10 bg-[#2f2d29]/98 p-2 text-[#f1ece4] shadow-[0_32px_80px_-40px_rgba(0,0,0,0.95)] backdrop-blur-xl"
                  >
                    <DropdownMenuItem
                      v-for="child in item.children"
                      :key="child.id"
                      :disabled="child.disabled"
                      class="rounded-xl px-3 py-2.5 text-[0.93rem] text-[#f1ece4] hover:bg-white/[0.04] focus:bg-white/[0.06]"
                    >
                      <span class="inline-flex size-4 shrink-0" />
                      <span class="flex-1 truncate text-left">{{ child.label }}</span>
                      <span
                        v-if="child.badge"
                        class="rounded-full border border-white/10 px-2 py-0.5 text-[0.64rem] uppercase tracking-[0.18em] text-[#c8c1b6]/80"
                      >
                        {{ child.badge }}
                      </span>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuItem
                  v-else
                  :disabled="item.disabled"
                  class="rounded-xl px-3 py-2.5 text-[0.95rem] text-[#f1ece4] hover:bg-white/[0.04] focus:bg-white/[0.06] data-[disabled]:text-[#a59d92]/45"
                >
                  <span class="inline-flex size-4 items-center justify-center shrink-0">
                    <Icon
                      v-if="item.checked"
                      name="lucide:check"
                      class="size-4 text-[#5fa7ff]"
                    />
                    <Icon
                      v-else-if="item.icon"
                      :name="item.icon"
                      class="size-4 text-[#cfc8be]"
                    />
                  </span>
                  <span class="flex-1 truncate text-left">{{ item.label }}</span>
                  <span
                    v-if="item.badge"
                    class="rounded-full border border-white/10 px-2 py-0.5 text-[0.64rem] uppercase tracking-[0.18em] text-[#c8c1b6]/80"
                  >
                    {{ item.badge }}
                  </span>
                </DropdownMenuItem>
              </template>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            class="inline-flex size-8 items-center justify-center rounded-full bg-[#24466f] text-[#87b8ff] transition hover:bg-[#2b5688] hover:text-[#b8d4ff]"
            aria-label="Knowledge base files"
          >
            <Icon name="lucide:folder-open" class="size-4" />
          </button>

          <span class="hidden sm:inline-flex">Ask Don Puerto</span>
        </div>

        <div class="flex items-center gap-3 text-sm">
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <button
                type="button"
                class="hidden items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[#d1ccc4]/82 transition hover:bg-white/[0.05] hover:text-[#f3efe9] md:inline-flex"
                :title="visibleAgentDescription || undefined"
              >
                <span>{{ visibleAgentLabel }}</span>
                <Icon name="lucide:chevron-down" class="size-3.5" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              side="top"
              :side-offset="12"
              class="w-[18rem] rounded-2xl border-white/10 bg-[#2f2d29]/98 p-2 text-[#f1ece4] shadow-[0_32px_80px_-40px_rgba(0,0,0,0.95)] backdrop-blur-xl"
            >
              <DropdownMenuItem
                v-for="option in agentOptions"
                :key="option.id"
                :disabled="!option.available"
                class="rounded-xl px-3 py-2.5 text-[0.95rem] text-[#f1ece4] hover:bg-white/[0.04] focus:bg-white/[0.06]"
              >
                <Icon
                  :name="option.id === selectedAgentId ? 'lucide:check' : 'lucide:bot'"
                  class="size-4"
                  :class="option.id === selectedAgentId ? 'text-[#5fa7ff]' : 'text-[#cfc8be]'"
                />
                <div class="flex min-w-0 flex-1 flex-col">
                  <span class="truncate">{{ option.label }}</span>
                  <span class="text-xs text-[#c8c1b6]/70">{{ option.description }}</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            type="button"
            size="icon"
            class="size-10 rounded-full bg-[#d4784c] text-white shadow-none hover:bg-[#e0885d]"
            :disabled="loading || !hasValue"
            @click="emit('submit')"
          >
            <Icon v-if="loading" name="lucide:loader-circle" class="size-5 animate-spin" />
            <Icon v-else name="lucide:arrow-up" class="size-4.5" />
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
