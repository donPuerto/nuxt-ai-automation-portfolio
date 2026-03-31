<script setup lang="ts">
import type {
  PortfolioAssistantResponse,
  PortfolioAssistantSection,
  PortfolioAssistantSectionLayout,
  PortfolioKnowledgeProject,
} from '@@/shared'
import { AnimatePresence, motion } from 'motion-v'
import DiscoveryCallButton from '../call/DiscoveryCallButton.vue'

const props = defineProps<{
  response: PortfolioAssistantResponse | null
  activePrompt?: string
  error?: string
  loading?: boolean
  expandedProjectSlug?: string | null
  getProjectBySlug: (slug: string) => PortfolioKnowledgeProject | undefined
}>()

const emit = defineEmits<{
  toggleProject: [slug: string]
}>()

const projectsForSection = (section: PortfolioAssistantSection) => {
  if (section.type !== 'projects') {
    return []
  }

  return section.projectSlugs
    .map(slug => props.getProjectBySlug(slug))
    .filter(Boolean) as PortfolioKnowledgeProject[]
}

const expandedProject = computed(() => {
  if (!props.expandedProjectSlug) {
    return null
  }

  return props.getProjectBySlug(props.expandedProjectSlug) ?? null
})

const expandedInteractiveProject = computed(() => {
  if (!expandedProject.value?.interactiveTool) {
    return null
  }

  return expandedProject.value
})

const responseKey = computed(() => {
  if (props.loading) {
    return 'loading'
  }

  if (props.error) {
    return `error-${props.error}`
  }

  if (!props.response) {
    return 'idle'
  }

  return `${props.activePrompt ?? 'response'}-${props.response.answer}`
})

const assistantAvatarColors = ['#D97757', '#E08A6A', '#C86A4A', '#D4734F', '#E89070', '#BF6040', '#D07050']

const sectionWidthClass = (layout?: PortfolioAssistantSectionLayout) => {
  switch (layout?.width) {
    case 'wide':
      return 'max-w-6xl'
    case 'full':
      return 'max-w-7xl'
    default:
      return 'max-w-4xl'
  }
}

const sectionAlignClass = (layout?: PortfolioAssistantSectionLayout) => {
  return layout?.align === 'center' ? 'mx-auto' : 'mx-0'
}
</script>

<template>
  <AnimatePresence mode="wait">
    <motion.div
      :key="responseKey"
      class="w-full"
      :initial="{ opacity: 0, y: 18, filter: 'blur(10px)' }"
      :animate="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
      :exit="{ opacity: 0, y: -12, filter: 'blur(6px)' }"
      :transition="{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }"
    >
      <div class="space-y-5 md:space-y-6">
        <motion.div
          v-if="loading"
          class="flex items-start gap-3 md:gap-4"
          :initial="{ opacity: 0, y: 12 }"
          :animate="{ opacity: 1, y: 0 }"
        >
          <div class="flex size-10 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/80 shadow-[0_14px_32px_-24px_rgba(0,0,0,0.55)]">
            <AiPortfolioSparkIcon
              :size="24"
              :speed="0.7"
              :colors="assistantAvatarColors"
            />
          </div>
          <div class="min-w-0 flex-1 rounded-[1.5rem] border border-border/60 bg-background/55 px-4 py-4 text-sm text-muted-foreground shadow-[0_18px_42px_-34px_rgba(0,0,0,0.55)] md:px-5">
            <div class="flex items-center gap-2">
              <Icon name="lucide:loader-circle" class="size-4 animate-spin text-primary" />
              <span>Loading response...</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          v-else-if="error"
          class="flex items-start gap-3 md:gap-4"
          :initial="{ opacity: 0, y: 12 }"
          :animate="{ opacity: 1, y: 0 }"
        >
          <div class="flex size-10 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/80 shadow-[0_14px_32px_-24px_rgba(0,0,0,0.55)]">
            <AiPortfolioSparkIcon
              :size="24"
              :speed="0.7"
              :colors="assistantAvatarColors"
            />
          </div>
          <div class="min-w-0 flex-1">
            <Alert variant="destructive">
              <AlertTitle>Assistant unavailable</AlertTitle>
              <AlertDescription>{{ error }}</AlertDescription>
            </Alert>
          </div>
        </motion.div>

        <template v-else-if="response">
          <motion.div
            v-if="activePrompt"
            class="flex justify-end"
            :initial="{ opacity: 0, y: 16 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.22, delay: 0.02 }"
          >
            <div class="max-w-[min(100%,44rem)] rounded-[1.45rem] border border-border/60 bg-muted/45 px-4 py-3 text-sm leading-6 text-foreground/88 shadow-[0_16px_36px_-28px_rgba(0,0,0,0.45)] md:px-5">
              {{ activePrompt }}
            </div>
          </motion.div>

          <motion.div
            class="relative"
            :initial="{ opacity: 0, y: 18 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.28, delay: 0.05 }"
          >
            <div class="absolute left-0 top-0 hidden md:flex size-10 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/80 shadow-[0_16px_34px_-24px_rgba(0,0,0,0.55)]">
              <AiPortfolioSparkIcon
                :size="24"
                :speed="0.8"
                :colors="assistantAvatarColors"
              />
            </div>

            <div class="mx-auto min-w-0 w-full max-w-7xl space-y-7 md:space-y-8 md:pl-14">
              <div class="space-y-4">
                <div class="text-xs font-semibold uppercase tracking-[0.22em] text-primary/90">
                  Don Puerto
                </div>
                <div class="max-w-none text-[0.98rem] leading-8 text-foreground/92 md:text-[1.03rem]">
                  {{ response.answer }}
                </div>
              </div>

              <template v-for="(section, index) in response.sections" :key="`${section.type}-${section.title}`">
                <motion.section
                  class="space-y-3"
                  :class="[sectionWidthClass(section.layout), sectionAlignClass(section.layout)]"
                  :initial="{ opacity: 0, y: 16 }"
                  :animate="{ opacity: 1, y: 0 }"
                  :transition="{ duration: 0.24, delay: 0.1 + index * 0.04 }"
                >
                  <div class="text-xs font-semibold uppercase tracking-[0.22em] text-primary/85">
                    {{ section.title }}
                  </div>

                  <div v-if="section.type === 'highlights'" class="space-y-3">
                    <div
                      v-for="item in section.items"
                      :key="item"
                      class="border-l border-border/70 pl-4 text-[0.95rem] leading-7 text-foreground/82"
                    >
                      {{ item }}
                    </div>
                  </div>

                  <div v-else-if="section.type === 'projects'" class="space-y-5">
                    <AiPortfolioExpandedProject
                      v-if="expandedInteractiveProject"
                      :project="expandedInteractiveProject"
                    />

                    <AiPortfolioProjectGrid
                      :projects="projectsForSection(section)"
                      :expanded-project-slug="expandedProjectSlug"
                      :layout="section.layout"
                      @select="emit('toggleProject', $event)"
                    />

                    <AiPortfolioExpandedProject
                      v-if="expandedProject && !expandedInteractiveProject"
                      :project="expandedProject"
                    />
                  </div>

                  <div v-else-if="section.type === 'cta'" class="flex justify-start">
                    <DiscoveryCallButton
                      :label="section.label"
                      variant="outline"
                      size="lg"
                      button-class="rounded-full px-6"
                    />
                  </div>
                </motion.section>
              </template>
            </div>
          </motion.div>
        </template>
      </div>
    </motion.div>
  </AnimatePresence>
</template>
