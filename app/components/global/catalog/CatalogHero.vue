<script setup lang="ts">
import { homeCatalogContent } from '@@/shared'
</script>

<template>
  <section class="relative overflow-hidden border-b border-border/50">
    <div class="absolute inset-0 -z-10 dark:hidden bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.10),transparent_28%),radial-gradient(circle_at_75%_18%,rgba(59,130,246,0.10),transparent_20%),linear-gradient(to_bottom,rgba(255,255,255,0.55),rgba(248,250,252,0.18))]" />
    <div class="absolute inset-0 -z-10 hidden dark:block bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.14),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.12),transparent_22%),linear-gradient(to_bottom,transparent,rgba(15,23,42,0.03))]" />
    <div class="container py-20 md:py-28">
      <div class="mx-auto max-w-5xl text-center">
        <div class="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          <Icon name="lucide:sparkles" class="size-4" />
          <span>{{ homeCatalogContent.eyebrow }}</span>
        </div>

        <div class="mt-6 space-y-6">
          <h1 class="text-balance text-4xl font-semibold tracking-tight text-foreground md:text-6xl xl:text-7xl">
            {{ homeCatalogContent.headline }}
          </h1>
          <p class="mx-auto max-w-3xl text-lg leading-8 text-muted-foreground md:text-xl">
            {{ homeCatalogContent.subheadline }}
          </p>
        </div>

        <div class="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Button as-child size="lg" class="rounded-full px-7">
            <NuxtLink to="/projects">
              {{ homeCatalogContent.finalCtaPrimary }}
            </NuxtLink>
          </Button>
          <DiscoveryCallButton
            :label="homeCatalogContent.finalCtaSecondary"
            variant="outline"
            size="lg"
            button-class="rounded-full px-7"
          />
        </div>
      </div>
    </div>
  </section>
</template>
