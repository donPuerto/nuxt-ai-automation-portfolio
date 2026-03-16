<script setup lang="ts">
import { accessPageDefaults, getCategoryBySlug, getProjectBySlugs, platformBundleOffers } from '@@/shared'

definePageMeta({
  path: '/projects/:category/:slug/access',
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
const accessContent = computed(() => ({
  ...accessPageDefaults,
  ...project.value!.access,
}))
const bundleOffer = computed(() => project.value?.access?.bundleOffer ?? platformBundleOffers[project.value!.primaryPlatform])

useSeoMeta({
  title: () => `${project.value?.title ?? 'Project'} Access | Don Puerto`,
  description: () => accessContent.value.subheadline ?? project.value?.summary ?? 'Instant access page',
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
        <span>Back to {{ project!.title }}</span>
      </NuxtLink>

      <div class="mt-6 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
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
                {{ category?.title }}
              </p>
              <h1 class="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
                {{ accessContent.headline }}
              </h1>
              <p class="mt-4 max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
                {{ accessContent.subheadline }}
              </p>
            </div>
          </div>

          <div class="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm">
            <p class="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              What you get
            </p>
            <ul class="mt-4 space-y-3">
              <li
                v-for="item in accessContent.includes"
                :key="item"
                class="flex gap-3 text-sm leading-7 text-muted-foreground md:text-base"
              >
                <Icon name="lucide:check-check" class="mt-1 size-4 shrink-0 text-primary" />
                <span>{{ item }}</span>
              </li>
            </ul>
          </div>

          <div v-if="project!.access?.upsells?.length" class="space-y-4">
            <p class="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              Optional add-ons
            </p>
            <CatalogAccessOfferCard
              v-for="offer in project!.access!.upsells"
              :key="offer.title"
              :offer="offer"
            />
          </div>

          <div v-if="bundleOffer" class="space-y-4">
            <p class="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              Bundle option
            </p>
            <CatalogAccessOfferCard :offer="bundleOffer" />
          </div>
        </div>

        <div class="space-y-6">
          <div class="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
            <p class="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              Instant access
            </p>
            <p class="mt-4 text-4xl font-semibold tracking-tight">
              {{ project!.priceLabel }}
            </p>
            <p class="mt-3 text-sm leading-7 text-muted-foreground">
              {{ accessContent.supportNote }}
            </p>

            <Button as-child size="lg" class="mt-6 w-full rounded-full">
              <NuxtLink :to="project!.paymentLink" target="_blank" rel="noreferrer">
                {{ accessContent.checkoutLabel }}
              </NuxtLink>
            </Button>

            <p v-if="accessContent.guarantee" class="mt-4 text-xs leading-6 text-muted-foreground">
              {{ accessContent.guarantee }}
            </p>
          </div>

          <div class="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-sm">
            <p class="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              Best fit for
            </p>
            <p class="mt-3 text-sm leading-7 text-muted-foreground md:text-base">
              {{ project!.audience }}
            </p>
          </div>

          <div class="rounded-3xl border border-border/60 bg-linear-to-br from-primary/10 to-secondary/10 p-6 shadow-sm">
            <p class="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              Need this customized?
            </p>
            <p class="mt-3 text-sm leading-7 text-muted-foreground md:text-base">
              If you want this project adapted to your CRM, processes, or client workflow, we can scope a custom version together.
            </p>

            <Button as-child variant="outline" size="lg" class="mt-6 w-full rounded-full">
              <NuxtLink to="/contact">
                Book a discovery call
              </NuxtLink>
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
