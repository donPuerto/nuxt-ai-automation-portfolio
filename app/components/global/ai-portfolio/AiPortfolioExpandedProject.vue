<script setup lang="ts">
import type { PortfolioKnowledgeProject } from '@@/shared'
import CatalogVideoEmbed from '../catalog/CatalogVideoEmbed.vue'
import DiscoveryCallButton from '../call/DiscoveryCallButton.vue'

const props = defineProps<{
  project: PortfolioKnowledgeProject
}>()
</script>

<template>
  <section
    :id="`expanded-project-${props.project.slug}`"
    class="scroll-mt-28"
  >
    <AiPortfolioVideoToTextTool
      v-if="props.project.interactiveTool?.type === 'video-to-text-transcriber'"
      :project="props.project"
    />

    <Card v-else class="rounded-[2rem] border-border/60 bg-card/80 shadow-sm">
      <CardContent class="space-y-6 p-6 md:p-8">
        <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div class="space-y-3">
            <div class="flex items-center gap-2">
              <span class="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                {{ project.categoryLabel }}
              </span>
              <span class="rounded-full border border-border/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Product card
              </span>
            </div>

            <div>
              <h3 class="text-2xl font-semibold tracking-tight text-foreground">
                {{ project.title }}
              </h3>
              <p class="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
                {{ project.summary }}
              </p>
            </div>
          </div>

          <div class="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-right">
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Offer
            </p>
            <p class="mt-2 text-lg font-semibold text-foreground">
              {{ project.priceLabel }}
            </p>
          </div>
        </div>

        <div class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <CatalogVideoEmbed :url="project.youtubeUrl || ''" :title="project.title" />

          <div class="space-y-4">
            <div class="rounded-2xl border border-border/60 bg-background/70 p-5">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Quick value
              </p>
              <ul class="mt-3 space-y-3 text-sm leading-6 text-foreground/90">
                <li
                  v-for="bullet in project.valueBullets"
                  :key="bullet"
                  class="flex items-start gap-3"
                >
                  <Icon name="lucide:check" class="mt-1 size-4 shrink-0 text-primary" />
                  <span>{{ bullet }}</span>
                </li>
              </ul>
            </div>

            <div class="rounded-2xl border border-border/60 bg-background/70 p-5">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Workflow overview
              </p>
              <ul class="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">
                <li
                  v-for="step in project.workflowOverview.slice(0, 3)"
                  :key="step"
                >
                  {{ step }}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-3 sm:flex-row">
          <Button as-child class="rounded-full px-6" size="lg">
            <NuxtLink :to="project.instantAccessUrl" target="_blank" rel="noopener noreferrer">
              Get Instant Access
            </NuxtLink>
          </Button>

          <DiscoveryCallButton
            label="Request Custom Version"
            variant="outline"
            size="lg"
            button-class="rounded-full px-6"
          />
        </div>
      </CardContent>
    </Card>
  </section>
</template>
