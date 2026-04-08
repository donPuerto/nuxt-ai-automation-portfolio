<script setup lang="ts">
import { motion } from 'motion-v'

defineProps<{
  show: boolean
}>()
</script>

<template>
  <div
    v-if="show"
    class="pointer-events-none absolute inset-0 z-30 rounded-[1.6rem] border border-primary/40 bg-background/85 backdrop-blur-sm"
  >
    <div class="absolute inset-0 flex items-center justify-center">
      <motion.div
        :initial="{ opacity: 0, y: 8 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.16 }"
        class="text-center"
      >
        <div class="mx-auto mb-3 inline-flex size-11 items-center justify-center rounded-full bg-primary/14 text-primary">
          <Icon name="lucide:upload" class="size-5" />
        </div>
        <p class="text-sm font-medium text-foreground">Drop files to attach</p>
        <p class="mt-1 text-xs text-muted-foreground">PDF, images, and docs are supported.</p>
      </motion.div>
    </div>
  </div>
</template>
