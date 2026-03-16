<script setup lang="ts">
import { allPlatforms, getCategoryBySlug, getProjectsByCategory } from '@@/shared'

const route = useRoute()
const selectedPlatform = ref('All')

const category = computed(() => getCategoryBySlug(route.params.category as string))

if (!category.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Category not found',
  })
}

const categoryProjects = computed(() => getProjectsByCategory(category.value!.slug))

const availablePlatforms = computed(() =>
  allPlatforms.filter(platform =>
    categoryProjects.value.some(project => project.platforms.includes(platform)),
  ),
)

const filteredProjects = computed(() => {
  if (selectedPlatform.value === 'All') {
    return categoryProjects.value
  }

  return categoryProjects.value.filter(project => project.platforms.includes(selectedPlatform.value))
})

useSeoMeta({
  title: () => `${category.value?.title ?? 'Category'} | Don Puerto`,
  description: () => category.value?.description ?? 'Automation systems category',
})
</script>

<template>
  <div class="container py-14 md:py-18">
    <div class="max-w-4xl">
      <NuxtLink to="/systems" class="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <Icon name="lucide:arrow-left" class="size-4" />
        <span>Back to catalog</span>
      </NuxtLink>

      <div class="mt-5 flex items-start gap-4">
        <div
          class="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-white/40 bg-linear-to-br shadow-sm"
          :class="[category?.accentFrom, category?.accentTo]"
        >
          <Icon :name="category!.icon" class="size-6" />
        </div>

        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
            {{ filteredProjects.length }} systems
          </p>
          <h1 class="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">
            {{ category!.title }}
          </h1>
          <p class="mt-4 max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
            {{ category!.description }}
          </p>
        </div>
      </div>
    </div>

    <div class="mt-8 rounded-3xl border border-border/60 bg-card/60 p-5 shadow-sm">
      <CatalogProjectFilters
        v-model:selected-platform="selectedPlatform"
        :platforms="availablePlatforms"
      />
    </div>

    <div class="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      <CatalogProjectCard
        v-for="project in filteredProjects"
        :key="project.slug"
        :project="project"
      />
    </div>
  </div>
</template>
