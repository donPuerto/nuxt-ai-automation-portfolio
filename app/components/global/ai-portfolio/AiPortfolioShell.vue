<script setup lang="ts">
import { aiPortfolioContent } from '@@/shared'

const {
  prompt,
  promptPlaceholder,
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
</script>

<template>
  <section class="relative flex min-h-screen w-full overflow-hidden px-4 pb-10 pt-6 md:px-8 md:pb-12 md:pt-8">
    <div class="pointer-events-none absolute inset-x-0 top-0 h-[42rem] bg-[radial-gradient(circle_at_12%_18%,rgba(34,197,94,0.22),transparent_26%),radial-gradient(circle_at_74%_24%,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_88%_62%,rgba(217,70,239,0.18),transparent_24%)] blur-3xl" />

    <div class="relative flex w-full flex-col">
      <div class="mb-4 flex w-full justify-end md:mb-6">
        <div class="inline-flex items-center rounded-full border border-border/60 bg-background/60 p-1.5 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.9)] backdrop-blur">
          <ThemeSelector />
        </div>
      </div>

      <div class="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center">
        <div class="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 text-center md:gap-7">
          <AiPortfolioAvatar />

          <div class="space-y-3">
            <p class="text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
              {{ aiPortfolioContent.nameLine }}
            </p>
            <p class="text-base text-muted-foreground md:text-lg">
              {{ aiPortfolioContent.descriptor }}
            </p>
          </div>

          <div class="w-full max-w-5xl">
            <AiPortfolioMarquee
              :items="aiPortfolioContent.marqueeItems"
              @select="runMarqueeIntent"
            />
          </div>

          <AiPortfolioNavigator
            :items="aiPortfolioContent.navItems"
            @select="runNavIntent"
          />

          <div class="w-full max-w-3xl">
            <AiPortfolioPrompt
              v-model="prompt"
              :placeholder="promptPlaceholder"
              :loading="loading"
              @submit="submitPrompt"
            />
          </div>
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
