<script setup lang="ts">
defineProps<{
  copyDisabled?: boolean
}>()

defineEmits<{
  copy: []
  regenerate: []
}>()
</script>

<template>
  <div class="flex items-center gap-1">
    <Button variant="ghost" size="icon" class="size-7" :disabled="copyDisabled" @click="$emit('copy')">
      <Icon name="lucide:copy" class="size-3.5" />
    </Button>
    <Button variant="ghost" size="icon" class="size-7" @click="$emit('regenerate')">
      <Icon name="lucide:refresh-cw" class="size-3.5" />
    </Button>
  </div>
</template>
