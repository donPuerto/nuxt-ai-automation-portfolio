<script setup lang="ts">
import type { CatalogProject } from '@@/shared'
import { getCategoryBySlug } from '@@/shared'

const props = withDefaults(defineProps<{
  project: CatalogProject
  showCategory?: boolean
}>(), {
  showCategory: false
})

const category = computed(() => getCategoryBySlug(props.project.category))
const projectUrl = computed(() => `/projects/${props.project.category}/${props.project.slug}`)
</script>

<template>
  <Card
    class="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-300/85 bg-white shadow-[0_18px_50px_-24px_rgba(15,23,42,0.24)] transition-all hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_24px_60px_-24px_rgba(15,23,42,0.28)] dark:border-border/60 dark:bg-card/82 dark:shadow-sm"
  >
    <CardHeader class="space-y-4">
      <div
        class="relative overflow-hidden rounded-2xl border border-slate-300/70 bg-linear-to-br p-5 text-white dark:border-border/50"
        :class="[category?.accentFrom ?? 'from-primary/40', category?.accentTo ?? 'to-primary/10']"
      >
        <div class="absolute inset-0 bg-slate-950/36 dark:bg-slate-950/12" />
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_38%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_40%)]" />
        <div class="relative space-y-4">
          <div class="flex flex-wrap gap-2">
            <span
              v-for="platform in project.platforms"
              :key="platform"
              class="rounded-full border border-white/20 bg-black/15 px-2.5 py-1 text-[11px] font-medium tracking-wide text-white/90"
            >
              {{ platform }}
            </span>
          </div>

          <div class="space-y-3">
            <div class="flex items-center justify-between gap-3">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                Workflow preview
              </p>
              <Icon name="lucide:play-circle" class="size-5 text-white/85" />
            </div>
            <p class="max-w-[24ch] text-lg font-semibold leading-snug text-white">
              {{ project.thumbnail }}
            </p>
          </div>
        </div>
      </div>

      <div class="space-y-3">
        <div v-if="showCategory && category" class="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          <Icon :name="category.icon" class="size-3.5" />
          <span>{{ category.shortTitle }}</span>
        </div>

        <div class="space-y-2">
          <CardTitle class="text-xl leading-tight">
            {{ project.title }}
          </CardTitle>
          <CardDescription class="text-sm leading-6 text-muted-foreground">
            {{ project.summary }}
          </CardDescription>
        </div>
      </div>
    </CardHeader>

    <CardContent class="flex flex-1 flex-col justify-end space-y-4">
      <div class="rounded-2xl border border-slate-200/80 bg-slate-50/92 p-4 dark:border-transparent dark:bg-muted/40">
        <p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Business outcome
        </p>
        <p class="mt-2 text-sm leading-6 text-foreground/90">
          {{ project.businessOutcome }}
        </p>
      </div>

      <div class="flex items-center justify-between gap-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Offer
          </p>
          <p class="mt-1 text-sm font-semibold text-foreground">
            {{ project.priceLabel }}
          </p>
        </div>

        <Button as-child variant="outline" class="rounded-full border-slate-300 bg-white hover:bg-slate-50 dark:border-border dark:bg-transparent">
          <NuxtLink :to="projectUrl">
            View project
          </NuxtLink>
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
