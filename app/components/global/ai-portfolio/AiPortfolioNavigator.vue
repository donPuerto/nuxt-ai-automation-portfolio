<script setup lang="ts">
import type { AiPortfolioNavIntent, AiPortfolioNavItem } from '@@/shared'
import DiscoveryCallButton from '../call/DiscoveryCallButton.vue'

defineProps<{
  items: readonly AiPortfolioNavItem[]
}>()

const emit = defineEmits<{
  select: [intent: AiPortfolioNavIntent]
}>()
</script>

<template>
  <div class="flex flex-wrap items-center justify-center gap-2">
    <template v-for="item in items" :key="item.id">
      <DiscoveryCallButton
        v-if="item.id === 'discovery-call'"
        :label="item.label"
        variant="outline"
        size="sm"
        button-class="rounded-xl border-border/60 bg-background/35 px-4 py-2.5 text-sm text-foreground/90 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.95)] backdrop-blur-md hover:bg-background/55"
      />

      <Button
        v-else
        type="button"
        variant="outline"
        size="sm"
        class="rounded-xl border-border/60 bg-background/35 px-4 py-2.5 text-sm text-foreground/90 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.95)] backdrop-blur-md hover:bg-background/55"
        @click="emit('select', item.id)"
      >
        <Icon :name="item.icon" class="mr-2 size-4" />
        {{ item.label }}
      </Button>
    </template>
  </div>
</template>
