<script setup lang="ts">
const route = useRoute()

const category = computed(() => route.query.category as string | undefined)
const project = computed(() => route.query.project as string | undefined)
const projectUrl = computed(() => {
  if (!category.value || !project.value) {
    return '/projects'
  }

  return `/projects/${category.value}/${project.value}`
})
</script>

<template>
  <div class="container py-16 md:py-24">
    <div class="mx-auto max-w-3xl rounded-3xl border border-border/60 bg-card/80 p-8 shadow-sm md:p-10">
      <p class="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
        Payment received
      </p>
      <h1 class="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
        Check your email for the workflow links
      </h1>
      <p class="mt-5 text-base leading-7 text-muted-foreground md:text-lg">
        Stripe confirmed the purchase. Our fulfillment flow will send the workflow links, setup notes, and any included bonus materials to the buyer email you entered at checkout.
      </p>

      <div class="mt-8 grid gap-4 rounded-2xl border border-border/60 bg-background/70 p-5 md:grid-cols-2">
        <div>
          <p class="text-sm font-semibold text-foreground">
            What happens next
          </p>
          <p class="mt-2 text-sm leading-7 text-muted-foreground">
            Email delivery usually arrives within a few minutes. If you do not see it, check spam or promotions before contacting support.
          </p>
        </div>
        <div>
          <p class="text-sm font-semibold text-foreground">
            Need help
          </p>
          <p class="mt-2 text-sm leading-7 text-muted-foreground">
            If the workflow link does not arrive, use the contact page and include the project name plus the email used during checkout.
          </p>
        </div>
      </div>

      <div class="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button as-child size="lg" class="rounded-full">
          <NuxtLink :to="projectUrl">
            Back to project
          </NuxtLink>
        </Button>
        <Button as-child variant="outline" size="lg" class="rounded-full">
          <NuxtLink to="/contact">
            Contact support
          </NuxtLink>
        </Button>
      </div>
    </div>
  </div>
</template>
