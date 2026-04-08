<script setup lang="ts">
import type { AiPortfolioHistoryEntry } from '@/composables/useAiPortfolio'
import type { AiPortfolioNavIntent } from '@@/shared'
import ChatSidebar from '@/components/chat/ChatSidebar.vue'

const props = defineProps<{
  historyEntries: AiPortfolioHistoryEntry[]
  activePrompt?: string
  activeIntent?: AiPortfolioNavIntent | 'prompt' | ''
}>()

const emit = defineEmits<{
  newChat: []
  navigate: [intent: AiPortfolioNavIntent]
  replay: [entry: AiPortfolioHistoryEntry]
}>()
</script>

<template>
  <ChatSidebar
    :history-entries="props.historyEntries"
    :active-prompt="props.activePrompt"
    :active-intent="props.activeIntent"
    @new-chat="emit('newChat')"
    @navigate="emit('navigate', $event)"
    @replay="emit('replay', $event)"
  />
</template>
