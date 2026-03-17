<script setup lang="ts">
const route = useRoute()

const category = computed(() => route.query.category as string | undefined)
const project = computed(() => route.query.project as string | undefined)
const accessUrl = computed(() => {
  if (!category.value || !project.value) {
    return '/projects'
  }

  return `/projects/${category.value}/${project.value}/access`
})
</script>

<template>
  <div class="container py-16 md:py-24">
    <div class="mx-auto max-w-3xl rounded-3xl border border-border/60 bg-card/80 p-8 shadow-sm md:p-10">
      <p class="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
        Checkout cancelled
      </p>
      <h1 class="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
        No worries, your project is still here
      </h1>
      <p class="mt-5 text-base leading-7 text-muted-foreground md:text-lg">
        The payment was not completed. You can return to the access page whenever you are ready and continue checkout from there.
      </p>

      <div class="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button as-child size="lg" class="rounded-full">
          <NuxtLink :to="accessUrl">
            Return to access page
          </NuxtLink>
        </Button>
        <Button as-child variant="outline" size="lg" class="rounded-full">
          <NuxtLink to="/projects">
            Browse other projects
          </NuxtLink>
        </Button>
      </div>
    </div>
  </div>
</template>
