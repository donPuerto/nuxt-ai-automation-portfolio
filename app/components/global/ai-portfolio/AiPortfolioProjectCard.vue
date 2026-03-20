<script setup lang="ts">
import type { PortfolioKnowledgeProject } from '@@/shared'

defineProps<{
  project: PortfolioKnowledgeProject
  expanded?: boolean
}>()

const emit = defineEmits<{
  select: [slug: string]
}>()
</script>

<template>
  <button
    type="button"
    class="group flex h-full w-full flex-col rounded-[1.75rem] border border-border/60 bg-card/75 p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-primary/30 hover:bg-card"
    @click="emit('select', project.slug)"
  >
    <div class="space-y-3">
      <div class="flex items-center justify-between gap-3">
        <span class="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
          {{ project.categoryLabel }}
        </span>
        <Icon
          :name="expanded ? 'lucide:minus' : 'lucide:plus'"
          class="size-4 text-muted-foreground transition group-hover:text-foreground"
        />
      </div>

      <div class="space-y-2">
        <h3 class="text-lg font-semibold leading-tight text-foreground">
          {{ project.title }}
        </h3>
        <p class="text-sm leading-6 text-muted-foreground">
          {{ project.summary }}
        </p>
      </div>
    </div>

    <div class="mt-5 rounded-2xl border border-border/50 bg-background/70 p-4">
      <p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Workflow preview
      </p>
      <p class="mt-2 text-sm font-medium text-foreground">
        {{ project.thumbnail }}
      </p>
    </div>

    <div class="mt-5 flex items-center justify-between text-sm">
      <span class="font-semibold text-foreground">{{ project.priceLabel }}</span>
      <span class="text-primary">{{ expanded ? 'Hide details' : 'View details' }}</span>
    </div>
  </button>
</template>
