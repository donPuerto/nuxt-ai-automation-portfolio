<script setup lang="ts">
import { aiPortfolioContent } from '@@/shared'
import { AnimatePresence, motion } from 'motion-v'
import AiPortfolioDescriptor from './AiPortfolioDescriptor.vue'

const {
  prompt,
  loading,
  error,
  response,
  hasResponse,
  activePrompt,
  expandedProjectSlug,
  submitPrompt,
  runNavIntent,
  toggleExpandedProject,
  getProjectBySlug,
} = useAiPortfolio()

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

const descriptorTexts = computed(() => {
  return aiPortfolioContent.descriptorLines.map(item => item.text)
})

const isConversationMode = computed(() =>
  loading.value || hasResponse.value || Boolean(error.value) || Boolean(activePrompt.value),
)

const greetingSparkColors = ['#D97757', '#E08A6A', '#C86A4A', '#D4734F', '#E89070', '#BF6040', '#D07050']
</script>

<template>
  <section class="relative min-h-screen w-full overflow-hidden">
    <div
      class="relative flex min-h-screen w-full flex-col px-4 pt-6 md:px-8 md:pt-8"
      :class="isConversationMode ? 'pb-60 sm:pb-64 md:pb-72' : 'pb-8 md:pb-10'"
    >
      <div class="mb-4 flex w-full justify-end md:mb-6">
        <ThemeSelector />
      </div>

      <div
        class="mx-auto flex w-full max-w-6xl flex-1 flex-col"
        :class="isConversationMode ? 'justify-start gap-6 md:gap-7' : 'justify-between'"
      >
        <AnimatePresence mode="wait">
          <motion.div
            v-if="!isConversationMode"
            key="landing-state"
            class="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-6 text-center md:gap-7"
            :initial="{ opacity: 0, y: 20, filter: 'blur(12px)' }"
            :animate="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
            :exit="{ opacity: 0, y: -18, filter: 'blur(10px)' }"
            :transition="{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }"
          >
            <AiPortfolioAvatar compact />

            <div class="space-y-1.5">
              <div class="relative flex justify-center">
                <div class="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 md:-left-10">
                  <AiPortfolioSparkIcon
                    :size="46"
                    :speed="0.8"
                    :colors="greetingSparkColors"
                  />
                </div>

                <div
                  class="text-center text-[2.1rem] leading-[1.02] text-[#3c342c] dark:text-[#efd7c0] md:text-[2.5rem]"
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

        <div
          v-if="!isConversationMode"
          class="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 pb-2"
        >
          <div class="w-full max-w-[42rem]">
            <AiPortfolioPrompt
              v-model="prompt"
              :loading="loading"
              :agent-label="aiPortfolioContent.promptAgentLabel"
              :agent-description="aiPortfolioContent.promptAgentDescription"
              :agent-options="aiPortfolioContent.promptAgentOptions"
              :selected-agent-id="aiPortfolioContent.selectedPromptAgentId"
              :tool-menu="aiPortfolioContent.promptToolMenu"
              @submit="submitPrompt"
            />
          </div>

          <AiPortfolioNavigator
            :items="aiPortfolioContent.navItems"
            @select="runNavIntent"
          />
        </div>
      </div>

        <AnimatePresence>
          <motion.div
            v-if="isConversationMode"
            class="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-4 md:px-8 md:pb-6"
            :initial="{ opacity: 0, y: 28 }"
            :animate="{ opacity: 1, y: 0 }"
            :exit="{ opacity: 0, y: 20 }"
            :transition="{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }"
          >
          <div
            class="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background via-background/88 to-transparent"
          />

          <div class="pointer-events-auto relative mx-auto flex w-full max-w-5xl flex-col items-center gap-3 md:pl-14">
            <div class="mx-auto w-full max-w-[54rem]">
              <AiPortfolioPrompt
                v-model="prompt"
                :loading="loading"
              :agent-label="aiPortfolioContent.promptAgentLabel"
              :agent-description="aiPortfolioContent.promptAgentDescription"
              :agent-options="aiPortfolioContent.promptAgentOptions"
              :selected-agent-id="aiPortfolioContent.selectedPromptAgentId"
              :tool-menu="aiPortfolioContent.promptToolMenu"
              @submit="submitPrompt"
            />
          </div>

          <AiPortfolioNavigator
            :items="aiPortfolioContent.navItems"
            @select="runNavIntent"
          />
        </div>
          </motion.div>
        </AnimatePresence>
    </div>
  </section>
</template>
