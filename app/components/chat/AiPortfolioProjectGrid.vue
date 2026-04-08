<script setup lang="ts">
import type { PortfolioAssistantSectionLayout, PortfolioKnowledgeProject } from '@@/shared'

const props = withDefaults(defineProps<{
  projects: PortfolioKnowledgeProject[]
  expandedProjectSlug?: string | null
  layout?: PortfolioAssistantSectionLayout
}>(), {
  layout: () => ({
    presentation: 'grid',
    width: 'full',
    align: 'center',
    minCardWidth: 19.5,
    maxColumns: 3,
  }),
})

const emit = defineEmits<{
  select: [slug: string]
}>()

const gridStyle = computed(() => {
  const minCardWidth = props.layout.minCardWidth ?? 19.5
  const maxColumns = props.layout.maxColumns ?? 3

  return {
    '--grid-gap': '1.25rem',
    '--grid-min-card-width': `${minCardWidth}rem`,
    '--grid-max-width': `calc(${maxColumns} * ${minCardWidth}rem + (${maxColumns} - 1) * 1.25rem)`,
  }
})

const gridWrapClasses = computed(() => {
  return props.layout.align === 'center'
    ? 'mx-auto'
    : 'mx-0'
})
</script>

<template>
  <div
    class="grid w-full [grid-template-columns:repeat(auto-fit,minmax(min(100%,var(--grid-min-card-width)),1fr))] gap-[var(--grid-gap)] max-w-[var(--grid-max-width)]"
    :class="gridWrapClasses"
    :style="gridStyle"
  >
    <AiPortfolioProjectCard
      v-for="project in projects"
      :key="project.slug"
      :project="project"
      :expanded="expandedProjectSlug === project.slug"
      @select="emit('select', $event)"
    />
  </div>
</template>
