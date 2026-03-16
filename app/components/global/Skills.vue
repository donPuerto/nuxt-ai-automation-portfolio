<template>
  <section class="py-16">
    <div class="mx-auto w-full px-4 fixed:max-w-350 fixed:3xl:max-w-screen-2xl">
      <div class="mx-auto max-w-3xl text-center">
        <p class="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
          Core capabilities
        </p>
        <h2 class="mt-3 text-3xl font-bold md:text-4xl">
          Technical stack across product, backend, and mobile delivery
        </h2>
        <p class="mt-4 text-base leading-7 text-muted-foreground md:text-lg">
          The portfolio is automation-heavy, but the implementation work also spans frontend apps, backend systems, and mobile experiences.
        </p>
      </div>

      <div class="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
        <Card
          v-for="group in expertiseGroups"
          :key="group.title"
          class="rounded-3xl border border-border/70 bg-card/80 shadow-sm"
        >
          <CardHeader class="space-y-3">
            <CardTitle class="text-2xl tracking-tight">
              {{ group.title }}
            </CardTitle>
            <CardDescription class="text-sm leading-6 text-muted-foreground">
              {{ group.description }}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div class="flex flex-wrap gap-3">
              <Badge
                v-for="skill in group.skills"
                :key="skill"
                variant="secondary"
                class="rounded-full px-4 py-2 text-sm font-medium"
              >
                {{ skill }}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { expertiseGroups } from '@@/shared'
</script>
