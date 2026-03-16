<script setup lang="ts">
defineProps<{
  selectedPlatform: string
  platforms: string[]
}>()

const emit = defineEmits<{
  'update:selectedPlatform': [value: string]
}>()
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <Button
      :variant="selectedPlatform === 'All' ? 'default' : 'outline'"
      class="rounded-full"
      size="sm"
      @click="emit('update:selectedPlatform', 'All')"
    >
      All platforms
    </Button>

    <Button
      v-for="platform in platforms"
      :key="platform"
      :variant="selectedPlatform === platform ? 'default' : 'outline'"
      class="rounded-full"
      size="sm"
      @click="emit('update:selectedPlatform', platform)"
    >
      {{ platform }}
    </Button>
  </div>
</template>
