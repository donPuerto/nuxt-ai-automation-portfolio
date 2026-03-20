<script setup lang="ts">
import type {
  PortfolioAssistantResponse,
  PortfolioAssistantSection,
  PortfolioKnowledgeProject,
} from '@@/shared'
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
</script>

<template>
  <Card class="rounded-[2rem] border-border/60 bg-card/80 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.8)] backdrop-blur">
    <CardContent class="space-y-8 p-6 md:p-8">
      <div v-if="loading" class="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/70 px-4 py-4 text-sm text-muted-foreground">
        <Icon name="lucide:loader-circle" class="size-4 animate-spin text-primary" />
        Loading response...
      </div>

      <Alert v-else-if="error" variant="destructive">
        <AlertTitle>Assistant unavailable</AlertTitle>
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <template v-else-if="response">
        <AiPortfolioResponseSection title="Answer">
          <template #header>
            <div v-if="activePrompt" class="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
              {{ activePrompt }}
            </div>
          </template>

          <div class="rounded-[1.75rem] border border-border/60 bg-background/55 px-5 py-5 text-sm leading-7 text-foreground/90 md:text-base">
            {{ response.answer }}
          </div>
        </AiPortfolioResponseSection>

        <template v-for="section in response.sections" :key="`${section.type}-${section.title}`">
          <AiPortfolioResponseSection
            v-if="section.type === 'highlights'"
            :title="section.title"
          >
            <div class="grid gap-3 md:grid-cols-2">
              <div
                v-for="item in section.items"
                :key="item"
                class="rounded-2xl border border-border/60 bg-background/60 p-4 text-sm leading-6 text-muted-foreground"
              >
                {{ item }}
              </div>
            </div>
          </AiPortfolioResponseSection>

          <AiPortfolioResponseSection
            v-else-if="section.type === 'projects'"
            :title="section.title"
          >
            <AiPortfolioProjectGrid
              :projects="projectsForSection(section)"
              :expanded-project-slug="expandedProjectSlug"
              @select="emit('toggleProject', $event)"
            />

            <AiPortfolioExpandedProject
              v-if="expandedProject"
              :project="expandedProject"
              class="mt-6"
            />
          </AiPortfolioResponseSection>

          <AiPortfolioResponseSection
            v-else-if="section.type === 'cta'"
            :title="section.title"
          >
            <div class="flex justify-start">
              <DiscoveryCallButton
                :label="section.label"
                variant="outline"
                size="lg"
                button-class="rounded-full px-6"
              />
            </div>
          </AiPortfolioResponseSection>
        </template>
      </template>
    </CardContent>
  </Card>
</template>
