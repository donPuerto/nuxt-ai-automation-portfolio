<script setup lang="ts">
import { getCategoryBySlug, getProjectBySlugs } from '@@/shared'

definePageMeta({
  path: '/projects/:category()/:slug()',
  alias: ['/systems/:category()/:slug()'],
})

const route = useRoute()

const project = computed(() =>
  getProjectBySlugs(route.params.category as string, route.params.slug as string),
)

if (!project.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Project not found',
  })
}

const category = computed(() => getCategoryBySlug(project.value!.category))

useSeoMeta({
  title: () => `${project.value?.title ?? 'Project'} | Don Puerto`,
  description: () => project.value?.summary ?? 'Automation project detail page',
})
</script>

<template>
  <div class="container py-14 md:py-18">
    <div class="max-w-5xl">
      <NuxtLink
        :to="`/projects/${project!.category}`"
        class="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <Icon name="lucide:arrow-left" class="size-4" />
        <span>Back to {{ category?.shortTitle ?? 'projects' }}</span>
      </NuxtLink>

      <div class="mt-6 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div class="space-y-6">
          <div class="space-y-4">
            <div class="flex flex-wrap items-center gap-2">
              <span
                v-for="platform in project!.platforms"
                :key="platform"
                class="rounded-full border border-border/60 bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground"
              >
                {{ platform }}
              </span>
              <span class="rounded-full border border-border/60 bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                {{ project!.priceLabel }}
              </span>
            </div>

            <div>
              <p class="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
                {{ category?.title }}
              </p>
              <h1 class="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
                {{ project!.title }}
              </h1>
              <p class="mt-4 text-base leading-7 text-muted-foreground md:text-lg">
                {{ project!.summary }}
              </p>
            </div>
          </div>

          <div class="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm">
            <p class="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              Business outcome
            </p>
            <p class="mt-3 text-base leading-7 text-foreground/90 md:text-lg">
              {{ project!.businessOutcome }}
            </p>
          </div>

          <CatalogVideoEmbed :url="project!.youtubeUrl" :title="project!.title" />
        </div>

        <div class="space-y-6">
          <div class="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm">
            <p class="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              What problem it solves
            </p>
            <p class="mt-3 text-sm leading-7 text-muted-foreground md:text-base">
              {{ project!.problem }}
            </p>

            <p class="mt-5 text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              How it works
            </p>
            <p class="mt-3 text-sm leading-7 text-muted-foreground md:text-base">
              {{ project!.solution }}
            </p>
          </div>

          <div class="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm">
            <p class="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              Workflow overview
            </p>
            <ul class="mt-4 space-y-3">
              <li
                v-for="step in project!.workflowOverview"
                :key="step"
                class="flex gap-3 text-sm leading-7 text-muted-foreground md:text-base"
              >
                <Icon name="lucide:check-circle-2" class="mt-1 size-4 shrink-0 text-primary" />
                <span>{{ step }}</span>
              </li>
            </ul>
          </div>

          <div class="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm">
            <p class="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              Included with the project
            </p>
            <ul class="mt-4 space-y-3">
              <li
                v-for="item in project!.deliverables"
                :key="item"
                class="flex gap-3 text-sm leading-7 text-muted-foreground md:text-base"
              >
                <Icon name="lucide:package-check" class="mt-1 size-4 shrink-0 text-primary" />
                <span>{{ item }}</span>
              </li>
            </ul>
          </div>

          <div class="rounded-3xl border border-border/60 bg-linear-to-br from-primary/10 to-secondary/10 p-6 shadow-sm">
            <p class="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              Results and use fit
            </p>
            <ul class="mt-4 space-y-3">
              <li
                v-for="result in project!.resultsOrExpectedOutcome"
                :key="result"
                class="flex gap-3 text-sm leading-7 text-muted-foreground md:text-base"
              >
                <Icon name="lucide:arrow-up-right" class="mt-1 size-4 shrink-0 text-primary" />
                <span>{{ result }}</span>
              </li>
            </ul>

            <div class="mt-6 rounded-2xl bg-background/75 p-4">
              <p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Best fit for
              </p>
              <p class="mt-2 text-sm font-medium text-foreground">
                {{ project!.audience }}
              </p>
              <p v-if="project!.anonymized" class="mt-2 text-xs leading-6 text-muted-foreground">
                This case is anonymized to protect client-specific data while keeping the architecture and deliverables visible.
              </p>
            </div>

            <div class="mt-6 flex flex-col gap-3">
              <Button as-child size="lg" class="rounded-full">
                <NuxtLink :to="`/projects/${project!.category}/${project!.slug}/access`">
                  Get Instant Access
                </NuxtLink>
              </Button>
              <Button as-child variant="outline" size="lg" class="rounded-full">
                <NuxtLink to="/contact">
                  Need a custom version?
                </NuxtLink>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
