<script setup lang="ts">
import { aiPortfolioContent } from '@@/shared'
import { AnimatePresence, motion } from 'motion-v'
import type { ChatFileWithStatus } from './chat-types'
import { Sidebar, SidebarInset, SidebarProvider, SidebarRail, SidebarTrigger } from '@/components/ui/sidebar'
import AiPortfolioPrompt from './AiPortfolioPrompt.vue'
import AiPortfolioDescriptor from './AiPortfolioDescriptor.vue'
import ChatSidebar from './ChatSidebar.vue'

const {
  prompt,
  loading,
  error,
  response,
  hasResponse,
  activePrompt,
  expandedProjectSlug,
  selectedAgentId,
  historyEntries,
  submitPrompt,
  runNavIntent,
  toggleExpandedProject,
  getProjectBySlug,
  selectAgent,
  resetConversation,
  replayHistoryEntry,
} = useAiPortfolio()

const sidebarExpanded = useState('ai-portfolio-sidebar-expanded', () => true)

const displayName = computed(() => aiPortfolioContent.nameLine.replace(/^Hey,\s*I'm\s*/i, '').trim())
const greetingPeriod = useState<'morning' | 'afternoon' | 'evening'>('ai-portfolio-greeting-period', () => {
  const hour = new Date().getHours()

  if (hour < 12) {
    return 'morning'
  }

  if (hour < 18) {
    return 'afternoon'
  }

  return 'evening'
})

const greetingLine = computed(() => {
  if (greetingPeriod.value === 'morning') {
    return `Good morning, ${displayName.value}`
  }

  if (greetingPeriod.value === 'afternoon') {
    return `Good afternoon, ${displayName.value}`
  }

  return `Good evening, ${displayName.value}`
})

const descriptorTexts = computed(() => aiPortfolioContent.descriptorLines.map(item => item.text))

const isConversationMode = computed(() =>
  loading.value || hasResponse.value || Boolean(error.value) || Boolean(activePrompt.value),
)

const activeSidebarIntent = computed(() => {
  const activeEntry = historyEntries.value.find(entry => entry.label === activePrompt.value.trim())

  if (activeEntry?.intent === 'me' || activeEntry?.intent === 'projects' || activeEntry?.intent === 'skills' || activeEntry?.intent === 'discovery-call') {
    return activeEntry.intent
  }

  return activePrompt.value ? 'prompt' : ''
})

const greetingSparkColors = ['#D97757', '#E08A6A', '#C86A4A', '#D4734F', '#E89070', '#BF6040', '#D07050']

const handleReplayHistory = async (entry: (typeof historyEntries.value)[number]) => {
  await replayHistoryEntry(entry)
}

const handleNewChat = () => {
  resetConversation()
}

const handleSidebarNavigate = async (intent: 'me' | 'projects' | 'skills' | 'discovery-call') => {
  await runNavIntent(intent)
}

const handlePromptSubmit = async (payload: { files: ChatFileWithStatus[] }) => {
  await submitPrompt(payload.files)
}
</script>

<template>
  <SidebarProvider v-model:open="sidebarExpanded" class="[--sidebar-width:17.75rem] [--sidebar-width-icon:3.35rem]">
    <section class="relative min-h-screen w-full overflow-hidden bg-background md:flex">
      <Sidebar
        side="left"
        variant="sidebar"
        collapsible="icon"
        class="border-r border-[#4a433d]/65 bg-[#262321] text-[#d7c8b7]"
      >
        <ChatSidebar
          :history-entries="historyEntries"
          :active-prompt="activePrompt"
          :active-intent="activeSidebarIntent"
          @new-chat="handleNewChat"
          @navigate="handleSidebarNavigate"
          @replay="handleReplayHistory"
        />
        <SidebarRail />
      </Sidebar>

      <SidebarInset class="relative min-w-0 flex-1">
        <div class="flex h-screen min-h-screen flex-col">
          <header class="sticky top-0 z-20 border-b border-[#4a433d]/55 bg-background/88 backdrop-blur">
            <div class="flex h-11 w-full items-center justify-between px-1 md:px-1.5">
              <div class="flex items-center">
                <SidebarTrigger class="size-8 text-[#d7c8b7] shadow-none [&_svg]:size-3.5 hover:bg-[#2d2926] hover:text-[#f3e5d1]" />
              </div>

              <div class="flex items-center">
                <ThemeSelector />
              </div>
            </div>
          </header>

          <div class="relative min-h-0 flex-1">
            <div class="h-full overflow-y-auto px-4 pb-72 pt-6 md:px-8 md:pb-[19rem] md:pt-8">
              <div class="mx-auto flex h-full w-full max-w-6xl flex-col">
                <AnimatePresence mode="wait">
                  <motion.div
                    v-if="!isConversationMode"
                    key="landing-state"
                    class="mx-auto flex min-h-[calc(100vh-20rem)] w-full max-w-4xl flex-1 flex-col items-center justify-center gap-6 text-center md:min-h-[calc(100vh-22rem)] md:gap-7"
                    :initial="{ opacity: 0, y: 20, filter: 'blur(12px)' }"
                    :animate="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
                    :exit="{ opacity: 0, y: -18, filter: 'blur(10px)' }"
                    :transition="{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }"
                  >
                    <AiPortfolioAvatar compact />

                    <div class="space-y-1.5">
                      <div class="relative flex justify-center">
                        <div class="pointer-events-none absolute left-0 top-1/2 hidden -translate-y-1/2 md:-left-10 md:block">
                          <AiPortfolioSparkIcon
                            :size="46"
                            :speed="0.8"
                            :colors="greetingSparkColors"
                          />
                        </div>

                        <div
                          class="text-center text-[2.1rem] leading-[1.02] text-[#3c342c] dark:text-[#efd7c0] md:text-[2.7rem]"
                          style="font-family: var(--font-serif); font-weight: 400;"
                        >
                          <AiPortfolioGreeting
                            :text="greetingLine"
                            :animation-type="aiPortfolioContent.greetingAnimation"
                            class="tracking-[-0.03em]"
                          />
                        </div>
                      </div>

                      <div class="flex justify-center">
                        <AiPortfolioDescriptor :texts="descriptorTexts" />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    v-else
                    key="conversation-state"
                    class="mx-auto w-full max-w-6xl pt-1 md:pt-2 2xl:max-w-7xl"
                    :initial="{ opacity: 0, y: 24, filter: 'blur(12px)' }"
                    :animate="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
                    :exit="{ opacity: 0, y: -16, filter: 'blur(8px)' }"
                    :transition="{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }"
                  >
                    <AiPortfolioCanvas
                      :response="response"
                      :active-prompt="activePrompt"
                      :error="error"
                      :loading="loading"
                      :expanded-project-slug="expandedProjectSlug"
                      :get-project-by-slug="getProjectBySlug"
                      @toggle-project="toggleExpandedProject"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div class="pointer-events-none absolute inset-x-0 bottom-0 z-30 pb-4 md:pb-6">
              <div class="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-background via-background/88 to-transparent" />

              <div class="pointer-events-auto relative mx-auto flex w-full max-w-6xl flex-col items-center gap-3 px-4 md:px-8">
                <div class="mx-auto w-full max-w-[54rem]">
                  <AiPortfolioPrompt
                    v-model="prompt"
                    :loading="loading"
                    :agent-label="aiPortfolioContent.promptAgentLabel"
                    :agent-description="aiPortfolioContent.promptAgentDescription"
                    :agent-options="aiPortfolioContent.promptAgentOptions"
                    :selected-agent-id="selectedAgentId"
                    @submit="handlePromptSubmit"
                    @select-agent="selectAgent"
                  />
                </div>

                <AiPortfolioNavigator
                  :items="aiPortfolioContent.navItems"
                  @select="runNavIntent"
                />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </section>
  </SidebarProvider>
</template>
