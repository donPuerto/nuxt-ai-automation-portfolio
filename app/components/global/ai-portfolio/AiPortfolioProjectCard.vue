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
    class="group relative flex h-full w-full flex-col overflow-hidden rounded-[1.75rem] border border-border/75 bg-card/92 p-5 text-left shadow-[0_18px_40px_-34px_rgba(0,0,0,0.52)] transition duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.01] hover:border-primary/35 hover:bg-card hover:shadow-[0_30px_60px_-36px_rgba(0,0,0,0.62)]"
    @click="emit('select', project.slug)"
  >
    <div class="pointer-events-none absolute inset-x-6 top-0 h-16 rounded-b-full bg-primary/8 opacity-0 blur-2xl transition duration-300 group-hover:opacity-100" />

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

    <div class="mt-5 rounded-2xl border border-border/60 bg-background/90 p-4 transition duration-300 group-hover:border-primary/20 group-hover:bg-background">
      <p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Workflow preview
      </p>
      <p class="mt-2 text-sm font-medium text-foreground transition duration-300 group-hover:text-foreground/95">
        {{ project.thumbnail }}
      </p>
    </div>

    <div class="mt-5 flex items-center justify-between text-sm">
      <span class="font-semibold text-foreground">{{ project.priceLabel }}</span>
      <span class="text-primary transition duration-300 group-hover:translate-x-0.5">{{ expanded ? 'Hide details' : 'View details' }}</span>
    </div>
  </button>
</template>
