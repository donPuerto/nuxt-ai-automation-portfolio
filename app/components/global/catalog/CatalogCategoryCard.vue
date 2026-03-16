<script setup lang="ts">
import type { CatalogCategory } from '@@/shared'

defineProps<{
  category: CatalogCategory
  count: number
}>()
</script>

<template>
  <NuxtLink
    :to="`/projects/${category.slug}`"
    class="group block rounded-3xl border border-border/70 bg-card/95 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-card dark:border-border/60 dark:bg-card/75"
  >
    <div class="flex items-start gap-4">
      <div
        class="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/40 bg-linear-to-br text-foreground shadow-sm"
        :class="[category.accentFrom, category.accentTo]"
      >
        <Icon :name="category.icon" class="size-5" />
      </div>

      <div class="min-w-0 flex-1 space-y-2">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="space-y-1">
            <p class="text-base font-semibold tracking-tight text-foreground md:text-lg">
              {{ category.title }}
            </p>
            <p class="max-w-2xl text-sm leading-6 text-muted-foreground">
              {{ category.description }}
            </p>
          </div>

          <div class="flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-medium text-muted-foreground dark:border-border/60 dark:bg-background/80">
            <span>{{ count }} projects</span>
            <Icon name="lucide:arrow-up-right" class="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>
