<script setup lang="ts">
import type {
  PortfolioAssistantResponse,
  PortfolioAssistantSection,
  PortfolioAssistantSectionLayout,
  PortfolioKnowledgeProject,
} from '@@/shared'
import { AnimatePresence, motion } from 'motion-v'
import { toast } from 'vue-sonner'
import DiscoveryCallButton from '../global/call/DiscoveryCallButton.vue'

const props = defineProps<{
  conversationTurns?: {
    id: string
    prompt: string
    response: PortfolioAssistantResponse | null
    error?: string
  }[]
  response: PortfolioAssistantResponse | null
  activePrompt?: string
  error?: string
  loading?: boolean
  expandedProjectSlug?: string | null
  getProjectBySlug: (slug: string) => PortfolioKnowledgeProject | undefined
}>()

const emit = defineEmits<{
  toggleProject: [slug: string]
  retryTurn: [prompt: string]
}>()

type TurnFeedback = 'up' | 'down'
const feedbackByTurn = reactive<Record<string, TurnFeedback | undefined>>({})

const toggleTurnFeedback = (turnId: string, value: TurnFeedback) => {
  feedbackByTurn[turnId] = feedbackByTurn[turnId] === value ? undefined : value
}

const copyTurnAnswer = async (turn: { id: string, response: PortfolioAssistantResponse | null, error?: string }) => {
  const text = turn.response?.answer?.trim() || turn.error?.trim() || ''
  if (!text) {
    toast.error('Nothing to copy')
    return
  }

  try {
    await navigator.clipboard.writeText(text)
    toast.success('Response copied')
  }
  catch {
    toast.error('Copy failed')
  }
}

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
  if (props.conversationTurns?.length) {
    return props.conversationTurns.map(turn => `${turn.id}:${turn.prompt}:${turn.response?.answer ?? turn.error ?? ''}`).join('|')
  }

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

const isStackSection = (section: PortfolioAssistantSection) => {
  if (section.type !== 'highlights') {
    return false
  }

  const title = section.title.toLowerCase()
  return title.includes('stack')
}

const renderedTurns = computed(() => {
  if (props.conversationTurns?.length) {
    return props.conversationTurns
  }

  if (!props.response) {
    return []
  }

  return [
    {
      id: 'single-response',
      prompt: props.activePrompt ?? '',
      response: props.response,
      error: props.error,
    },
  ]
})
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
      <div class="space-y-1.5 md:space-y-2">
        <template v-if="renderedTurns.length">
          <div class="space-y-1.5 md:space-y-2">
            <template v-for="(turn, turnIndex) in renderedTurns" :key="turn.id">
              <motion.div
                v-if="turn.prompt"
                class="flex justify-end"
                :initial="{ opacity: 0, y: 16 }"
                :animate="{ opacity: 1, y: 0 }"
                :transition="{ duration: 0.22, delay: 0.02 + turnIndex * 0.02 }"
              >
                <div class="max-w-[min(100%,44rem)] rounded-xl border border-border/60 bg-background/75 px-4 py-2.5 text-sm leading-5 text-foreground shadow-sm break-words [overflow-wrap:anywhere]">
                  {{ turn.prompt }}
                </div>
              </motion.div>

              <motion.div
                class="relative"
                :initial="{ opacity: 0, y: 18 }"
                :animate="{ opacity: 1, y: 0 }"
                :transition="{ duration: 0.28, delay: 0.05 + turnIndex * 0.03 }"
              >
                <div class="absolute left-0 top-0 hidden md:flex size-7 shrink-0 items-center justify-center">
                  <AiPortfolioSparkIcon
                    :size="18"
                    :speed="0.8"
                    :colors="assistantAvatarColors"
                  />
                </div>

                <div class="mx-auto min-w-0 w-full max-w-7xl space-y-1.5 md:space-y-2 md:pl-9">
                  <div class="group max-w-4xl space-y-1.5">
                    <div class="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary/90">
                      Don Puerto
                    </div>
                    <div class="max-w-[46rem] text-[1rem] leading-[1.55rem] text-foreground/90 break-words [overflow-wrap:anywhere] md:text-[1.03rem] md:leading-[1.65rem]">
                      {{ turn.response?.answer || turn.error || '' }}
                    </div>
                    <div class="flex items-center gap-1.5 pt-1 opacity-0 transition-opacity duration-150 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto">
                      <button
                        type="button"
                        class="inline-flex size-7 items-center justify-center rounded-md border border-transparent text-foreground/62 transition hover:border-border/60 hover:bg-background/70 hover:text-foreground"
                        aria-label="Copy response"
                        @click="copyTurnAnswer(turn)"
                      >
                        <Icon name="lucide:copy" class="size-3.5" />
                      </button>

                      <button
                        type="button"
                        class="inline-flex size-7 items-center justify-center rounded-md border transition"
                        :class="feedbackByTurn[turn.id] === 'up'
                          ? 'border-border bg-background/85 text-foreground'
                          : 'border-transparent text-foreground/62 hover:border-border/60 hover:bg-background/70 hover:text-foreground'"
                        aria-label="Thumbs up"
                        @click="toggleTurnFeedback(turn.id, 'up')"
                      >
                        <Icon name="lucide:thumbs-up" class="size-3.5" />
                      </button>

                      <button
                        type="button"
                        class="inline-flex size-7 items-center justify-center rounded-md border transition"
                        :class="feedbackByTurn[turn.id] === 'down'
                          ? 'border-border bg-background/85 text-foreground'
                          : 'border-transparent text-foreground/62 hover:border-border/60 hover:bg-background/70 hover:text-foreground'"
                        aria-label="Thumbs down"
                        @click="toggleTurnFeedback(turn.id, 'down')"
                      >
                        <Icon name="lucide:thumbs-down" class="size-3.5" />
                      </button>

                      <button
                        type="button"
                        class="inline-flex size-7 items-center justify-center rounded-md border border-transparent text-foreground/62 transition hover:border-border/60 hover:bg-background/70 hover:text-foreground"
                        aria-label="Retry prompt"
                        @click="turn.prompt && emit('retryTurn', turn.prompt)"
                      >
                        <Icon name="lucide:rotate-ccw" class="size-3.5" />
                      </button>
                    </div>
                  </div>

                  <template v-for="(section, index) in turn.response?.sections ?? []" :key="`${turn.id}-${section.type}-${section.title}`">
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

                      <div v-if="section.type === 'highlights' && isStackSection(section)">
                        <AiPortfolioStackRail :items="section.items" />
                      </div>

                      <div v-else-if="section.type === 'highlights'" class="space-y-3">
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
        </template>

        <motion.div
          v-if="loading"
          class="flex items-start gap-3 md:gap-4"
          :initial="{ opacity: 0, y: 12 }"
          :animate="{ opacity: 1, y: 0 }"
        >
          <div class="flex size-7 shrink-0 items-center justify-center">
            <AiPortfolioSparkIcon
              :size="18"
              :speed="0.7"
              :colors="assistantAvatarColors"
            />
          </div>
          <div class="min-w-0 flex-1 rounded-[1.5rem] border border-border/60 bg-background/55 px-4 py-4 text-sm text-muted-foreground shadow-[0_18px_42px_-34px_rgba(0,0,0,0.55)] md:px-5">
            <div class="flex max-w-xs items-center gap-2.5">
              <span class="size-1.5 rounded-full bg-primary/80 animate-bounce [animation-delay:-0.2s]" />
              <span class="size-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:-0.1s]" />
              <span class="size-1.5 rounded-full bg-primary/60 animate-bounce" />
              <Skeleton class="h-2.5 w-28 rounded-full bg-primary/15" />
            </div>
          </div>
        </motion.div>

        <motion.div
          v-else-if="error"
          class="flex items-start gap-3 md:gap-4"
          :initial="{ opacity: 0, y: 12 }"
          :animate="{ opacity: 1, y: 0 }"
        >
          <div class="flex size-7 shrink-0 items-center justify-center">
            <AiPortfolioSparkIcon
              :size="18"
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
      </div>
    </motion.div>
  </AnimatePresence>
</template>
