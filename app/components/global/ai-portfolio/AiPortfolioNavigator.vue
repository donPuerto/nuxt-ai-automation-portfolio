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
  <div class="flex flex-wrap items-center justify-center gap-3">
    <template v-for="item in items" :key="item.id">
      <DiscoveryCallButton
        v-if="item.id === 'discovery-call'"
        :label="item.label"
        variant="outline"
        size="lg"
        button-class="rounded-2xl border-border/60 bg-card/65 px-5 py-6 text-base backdrop-blur hover:bg-card"
      />

      <Button
        v-else
        type="button"
        variant="outline"
        size="lg"
        class="rounded-2xl border-border/60 bg-card/65 px-5 py-6 text-base backdrop-blur hover:bg-card"
        @click="emit('select', item.id)"
      >
        <Icon :name="item.icon" class="mr-2 size-4" />
        {{ item.label }}
      </Button>
    </template>
  </div>
</template>
