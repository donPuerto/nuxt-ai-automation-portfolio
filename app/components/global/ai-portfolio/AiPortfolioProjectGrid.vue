<script setup lang="ts">
import type { PortfolioKnowledgeProject } from '@@/shared'

defineProps<{
  projects: PortfolioKnowledgeProject[]
  expandedProjectSlug?: string | null
}>()

const emit = defineEmits<{
  select: [slug: string]
}>()
</script>

<template>
  <div class="grid gap-4 lg:grid-cols-2">
    <AiPortfolioProjectCard
      v-for="project in projects"
      :key="project.slug"
      :project="project"
      :expanded="expandedProjectSlug === project.slug"
      @select="emit('select', $event)"
    />
  </div>
</template>
