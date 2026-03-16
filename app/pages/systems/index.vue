<script setup lang="ts">
import { allPlatforms, catalogCategories, catalogProjects, getPlatformLabel, getProjectsByCategory } from '@@/shared'

definePageMeta({
  path: '/projects',
  alias: ['/systems'],
})

const selectedPlatform = ref('All')

const filteredProjects = computed(() => {
  if (selectedPlatform.value === 'All') {
    return catalogProjects
  }

  return catalogProjects.filter(project => getPlatformLabel(project.primaryPlatform) === selectedPlatform.value)
})

const categorySections = computed(() =>
  catalogCategories
    .map(category => ({
      category,
      projects: filteredProjects.value.filter(project => project.category === category.slug),
      count: getProjectsByCategory(category.slug).length,
    }))
    .filter(section => section.projects.length > 0),
)

useSeoMeta({
  title: 'Projects Catalog | Don Puerto',
  description: 'Browse automation projects by category and platform.',
})
</script>

<template>
  <div class="container py-14 md:py-18">
    <div class="max-w-3xl">
      <p class="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
        Projects catalog
      </p>
      <h1 class="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
        Browse the full catalog of automation projects
      </h1>
      <p class="mt-4 text-base leading-7 text-muted-foreground md:text-lg">
        Explore the full catalog by business outcome, then narrow by platform when you want to see the stack behind each project.
      </p>
    </div>

    <div class="mt-8 rounded-3xl border border-border/60 bg-card/60 p-5 shadow-sm">
      <CatalogProjectFilters v-model:selected-platform="selectedPlatform" :platforms="allPlatforms" />
    </div>

    <div class="mt-10 space-y-12">
      <section v-for="section in categorySections" :key="section.category.slug" class="space-y-5">
        <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p class="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              {{ section.count }} projects
            </p>
            <h2 class="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
              {{ section.category.title }}
            </h2>
            <p class="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
              {{ section.category.description }}
            </p>
          </div>

          <Button as-child variant="outline" class="rounded-full self-start md:self-auto">
            <NuxtLink :to="`/projects/${section.category.slug}`">
              Open category
            </NuxtLink>
          </Button>
        </div>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          <CatalogProjectCard
            v-for="project in section.projects.slice(0, 3)"
            :key="project.slug"
            :project="project"
          />
        </div>
      </section>
    </div>
  </div>
</template>
