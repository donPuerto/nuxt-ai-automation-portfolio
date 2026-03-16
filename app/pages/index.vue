<script setup lang="ts">
import {
  catalogCategories,
  getFeaturedProjects,
  getProjectsByCategory,
  homeCatalogContent,
  homePageCopy,
} from '@@/shared'

const featuredProjects = getFeaturedProjects()

const categorySummaries = computed(() =>
  catalogCategories.map(category => ({
    category,
    count: getProjectsByCategory(category.slug).length,
  })),
)

useSeoMeta({
  title: `${homePageCopy.metaTitle} | Don Puerto`,
  description: homePageCopy.metaDescription,
})
</script>

<template>
  <div class="pb-20">
    <CatalogHero />

    <section class="container py-16 md:py-20">
      <div class="mx-auto max-w-3xl text-center">
        <p class="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
          {{ homeCatalogContent.featuredCategoriesLabel }}
        </p>
        <h2 class="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
          Explore systems by business outcome
        </h2>
        <p class="mt-4 text-base leading-7 text-muted-foreground md:text-lg">
          Start with the outcome you want to improve. Platform choices stay visible, but the catalog is organized around the business problem each system solves.
        </p>
      </div>

      <div class="mt-10 space-y-4">
        <CatalogCategoryCard
          v-for="{ category, count } in categorySummaries"
          :key="category.slug"
          :category="category"
          :count="count"
        />
      </div>
    </section>

    <section class="container py-8 md:py-14">
      <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
            {{ homeCatalogContent.featuredProjectsLabel }}
          </p>
          <h2 class="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Featured systems with clear buyer outcomes
          </h2>
        </div>

        <Button as-child variant="outline" class="rounded-full self-start md:self-auto">
          <NuxtLink to="/systems">
            View the full catalog
          </NuxtLink>
        </Button>
      </div>

      <div class="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <CatalogProjectCard
          v-for="project in featuredProjects"
          :key="project.slug"
          :project="project"
          show-category
        />
      </div>
    </section>

    <section class="container py-14 md:py-18">
      <div class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div class="rounded-3xl border border-border/60 bg-card/70 p-8 shadow-sm">
          <p class="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
            {{ homeCatalogContent.processLabel }}
          </p>
          <h2 class="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Built like deliverables, not vague portfolio entries
          </h2>
          <div class="mt-8 space-y-5">
            <div
              v-for="(step, index) in homeCatalogContent.processSteps"
              :key="step"
              class="flex gap-4"
            >
              <div class="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold text-primary">
                0{{ index + 1 }}
              </div>
              <p class="pt-1 text-sm leading-7 text-muted-foreground md:text-base">
                {{ step }}
              </p>
            </div>
          </div>
        </div>

        <div class="relative overflow-hidden rounded-3xl border border-border/60 bg-linear-to-br from-primary/10 via-background to-secondary/20 p-8 shadow-sm">
          <GlowBorder :border-width="1.5" :duration="12" :color="['rgba(56,189,248,0.5)', 'rgba(168,85,247,0.45)', 'rgba(34,197,94,0.35)']" />
          <div class="relative z-10 flex h-full flex-col justify-between gap-8">
            <div>
              <p class="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
                Curated launch scope
              </p>
              <h3 class="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
                Start with 8–12 flagship systems and keep expanding the catalog over time.
              </h3>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="rounded-2xl border border-border/50 bg-background/75 p-4">
                <p class="text-2xl font-semibold">
                  {{ featuredProjects.length }}
                </p>
                <p class="mt-1 text-sm text-muted-foreground">
                  Featured systems
                </p>
              </div>
              <div class="rounded-2xl border border-border/50 bg-background/75 p-4">
                <p class="text-2xl font-semibold">
                  {{ categorySummaries.length }}
                </p>
                <p class="mt-1 text-sm text-muted-foreground">
                  Outcome categories
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="container py-8 md:py-14">
      <div class="rounded-[2rem] border border-border/60 bg-card/70 px-6 py-8 text-center shadow-sm md:px-10 md:py-12">
        <p class="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
          Next step
        </p>
        <h2 class="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
          {{ homeCatalogContent.finalCtaTitle }}
        </h2>
        <p class="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
          {{ homeCatalogContent.finalCtaBody }}
        </p>
        <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button as-child size="lg" class="rounded-full px-7">
            <NuxtLink to="/systems">
              {{ homeCatalogContent.finalCtaPrimary }}
            </NuxtLink>
          </Button>
          <Button as-child variant="outline" size="lg" class="rounded-full px-7">
            <NuxtLink to="/contact">
              {{ homeCatalogContent.finalCtaSecondary }}
            </NuxtLink>
          </Button>
        </div>
      </div>
    </section>
  </div>
</template>
