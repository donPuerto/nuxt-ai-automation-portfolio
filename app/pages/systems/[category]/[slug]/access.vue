<script setup lang="ts">
import { accessPageDefaults, getCategoryBySlug, getProjectBySlugs, platformBundleOffers } from '@@/shared'

definePageMeta({
  path: '/projects/:category()/:slug()/access',
  alias: ['/systems/:category()/:slug()/access'],
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

const accessConfig = computed(() => project.value!.access ?? {})
const includes = computed(() =>
  accessConfig.value.includes?.length
    ? accessConfig.value.includes
    : project.value!.deliverables
)
const checkoutLabel = computed(() =>
  accessConfig.value.checkoutLabel || accessPageDefaults.checkoutLabel
)
const checkoutUrl = computed(() =>
  accessConfig.value.checkoutUrl || project.value!.paymentLink
)
const guarantee = computed(() =>
  accessConfig.value.guarantee || accessPageDefaults.guarantee
)
const supportNote = computed(() =>
  accessConfig.value.supportNote || accessPageDefaults.supportNote
)
const bundleOffer = computed(() =>
  accessConfig.value.bundleOffer ?? platformBundleOffers[project.value!.primaryPlatform]
)
const upsells = computed(() => accessConfig.value.upsells ?? [])

useSeoMeta({
  title: () => `${project.value?.title ?? 'Project'} Access | Don Puerto`,
  description: () =>
    accessConfig.value.subheadline
    || project.value?.summary
    || 'Project access and checkout page',
})
</script>

<template>
  <div class="container py-14 md:py-18">
    <div class="mx-auto max-w-6xl">
      <NuxtLink
        :to="`/projects/${project!.category}/${project!.slug}`"
        class="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <Icon name="lucide:arrow-left" class="size-4" />
        <span>Back to project</span>
      </NuxtLink>

      <div class="mt-6 grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
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
            </div>

            <div>
              <p class="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
                {{ accessConfig.eyebrow || accessPageDefaults.eyebrow }}
              </p>
              <h1 class="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
                {{ accessConfig.headline || `Get instant access to ${project!.title}` }}
              </h1>
              <p class="mt-4 max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
                {{ accessConfig.subheadline || project!.summary }}
              </p>
            </div>
          </div>

          <Card class="rounded-3xl border border-border/60 bg-card/70 shadow-sm">
            <CardHeader>
              <CardTitle class="text-2xl">
                What you get inside
              </CardTitle>
              <CardDescription class="text-sm leading-6 text-muted-foreground">
                Project assets and guidance are scoped so you can move from purchase to implementation quickly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul class="space-y-3">
                <li
                  v-for="item in includes"
                  :key="item"
                  class="flex gap-3 text-sm leading-7 text-muted-foreground md:text-base"
                >
                  <Icon name="lucide:check-circle-2" class="mt-1 size-4 shrink-0 text-primary" />
                  <span>{{ item }}</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card class="rounded-3xl border border-border/60 bg-card/70 shadow-sm">
            <CardHeader>
              <CardTitle class="text-2xl">
                Why this project exists
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-4 text-sm leading-7 text-muted-foreground md:text-base">
              <p>{{ project!.problem }}</p>
              <p>{{ project!.solution }}</p>
            </CardContent>
          </Card>

          <CatalogVideoEmbed :url="project!.youtubeUrl" :title="project!.title" />
        </div>

        <div class="space-y-6">
          <Card class="rounded-3xl border border-border/60 bg-card/80 shadow-sm">
            <CardHeader class="space-y-3">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
                    {{ category?.shortTitle || 'Project access' }}
                  </p>
                  <CardTitle class="mt-2 text-3xl">
                    {{ project!.priceLabel }}
                  </CardTitle>
                </div>
                <Icon name="lucide:shield-check" class="mt-1 size-6 text-primary" />
              </div>
              <CardDescription class="text-sm leading-6 text-muted-foreground">
                {{ guarantee }}
              </CardDescription>
            </CardHeader>

            <CardContent class="space-y-5">
              <Button as-child size="lg" class="w-full rounded-full">
                <a :href="checkoutUrl" target="_blank" rel="noopener noreferrer">
                  {{ checkoutLabel }}
                </a>
              </Button>

              <div class="rounded-2xl border border-border/60 bg-muted/30 p-4">
                <p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Best fit for
                </p>
                <p class="mt-2 text-sm font-medium leading-6 text-foreground">
                  {{ project!.audience }}
                </p>
              </div>

              <div class="rounded-2xl border border-border/60 bg-muted/20 p-4">
                <p class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Need a custom version?
                </p>
                <p class="mt-2 text-sm leading-6 text-muted-foreground">
                  {{ supportNote }}
                </p>
                <Button as-child variant="outline" class="mt-4 rounded-full">
                  <NuxtLink to="/contact">
                    Book a custom build
                  </NuxtLink>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div v-if="upsells.length || bundleOffer" class="space-y-4">
            <div>
              <p class="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
                Optional add-ons
              </p>
              <h2 class="mt-2 text-2xl font-semibold tracking-tight">
                Extend this project without leaving the same flow
              </h2>
            </div>

            <CatalogAccessOfferCard
              v-for="offer in upsells"
              :key="`${project!.slug}-${offer.title}`"
              :offer="offer"
            />

            <CatalogAccessOfferCard
              v-if="bundleOffer"
              :offer="bundleOffer"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
