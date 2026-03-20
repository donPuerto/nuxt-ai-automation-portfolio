<script setup lang="ts">
import { aiPortfolioContent } from '@@/shared'
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
  runMarqueeIntent,
  toggleExpandedProject,
  getProjectBySlug,
} = useAiPortfolio()

const displayName = computed(() => aiPortfolioContent.nameLine.replace(/^Hey,\s*I'm\s*/i, '').trim())

const greetingLine = computed(() => {
  const hour = new Date().getHours()

  if (hour < 12) {
    return `Good morning, ${displayName.value}`
  }

  if (hour < 18) {
    return `Good afternoon, ${displayName.value}`
  }

  return `Good evening, ${displayName.value}`
})

const descriptorTexts = computed(() => {
  return aiPortfolioContent.descriptorLines.map(item => item.text)
})
</script>

<template>
  <section class="relative min-h-screen w-full overflow-hidden bg-[#11100f]">
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(32,120,73,0.22),transparent_28%),radial-gradient(circle_at_78%_18%,rgba(56,189,248,0.12),transparent_25%),radial-gradient(circle_at_88%_68%,rgba(217,70,239,0.14),transparent_24%),linear-gradient(180deg,rgba(17,16,15,0.98)_0%,rgba(13,12,12,0.97)_100%)]" />
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_78%,rgba(22,163,74,0.12),transparent_26%),radial-gradient(circle_at_74%_82%,rgba(124,58,237,0.1),transparent_22%)] blur-3xl" />

    <div class="relative flex min-h-screen w-full flex-col px-4 pb-8 pt-6 md:px-8 md:pb-10 md:pt-8">
      <div class="mb-4 flex w-full justify-end md:mb-6">
        <ThemeSelector />
      </div>

      <div class="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-between">
        <div class="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-6 text-center md:gap-7">
          <AiPortfolioAvatar compact />

          <div class="space-y-3">
            <div class="inline-flex items-center gap-3 text-[2.15rem] leading-none text-[#efd7c0] md:text-[5rem]" style="font-family: Lora, Georgia, serif;">
              <Icon name="lucide:sparkles" class="size-7 text-[#df7f55] md:size-8" />
              <AiPortfolioGreeting
                :text="greetingLine"
                :animation-type="aiPortfolioContent.greetingAnimation"
                class="tracking-[-0.035em]"
              />
            </div>

            <AiPortfolioDescriptor :texts="descriptorTexts" />
          </div>
        </div>

        <div class="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 pb-2">
          <div class="w-full max-w-4xl">
            <AiPortfolioMarquee
              :items="aiPortfolioContent.marqueeItems"
              @select="runMarqueeIntent"
            />
          </div>

          <div class="w-full max-w-3xl">
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

      <div
        v-if="hasResponse || loading || error"
        class="mx-auto mt-10 w-full max-w-6xl"
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
      </div>
    </div>
  </section>
</template>
