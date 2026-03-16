<script setup lang="ts">
import type { CatalogProjectOffer } from '@@/shared'

defineProps<{
  offer: CatalogProjectOffer
}>()
</script>

<template>
  <Card class="rounded-3xl border border-border/60 bg-card/70 shadow-sm">
    <CardHeader class="space-y-3">
      <div class="space-y-1">
        <CardTitle class="text-xl leading-tight">
          {{ offer.title }}
        </CardTitle>
        <CardDescription class="text-sm leading-6 text-muted-foreground">
          {{ offer.summary }}
        </CardDescription>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <span class="text-base font-semibold text-foreground">
          {{ offer.priceLabel }}
        </span>
        <span v-if="offer.originalPriceLabel" class="text-sm text-muted-foreground line-through">
          {{ offer.originalPriceLabel }}
        </span>
      </div>
    </CardHeader>

    <CardContent class="space-y-5">
      <ul v-if="offer.bullets?.length" class="space-y-3">
        <li
          v-for="bullet in offer.bullets"
          :key="bullet"
          class="flex gap-3 text-sm leading-6 text-muted-foreground"
        >
          <Icon name="lucide:check" class="mt-1 size-4 shrink-0 text-primary" />
          <span>{{ bullet }}</span>
        </li>
      </ul>

      <Button as-child class="w-full rounded-full">
        <a :href="offer.paymentLink" target="_blank" rel="noopener noreferrer">
          {{ offer.ctaLabel }}
        </a>
      </Button>
    </CardContent>
  </Card>
</template>
