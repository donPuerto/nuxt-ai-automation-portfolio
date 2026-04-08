<script setup lang="ts">
const modelValue = defineModel<string>({ default: '' })

defineEmits<{
  save: [value: string]
  cancel: []
}>()
</script>

<template>
  <div class="space-y-2">
    <Textarea v-model="modelValue" rows="4" class="min-h-24" />
    <div class="flex justify-end gap-2">
      <Button variant="outline" size="sm" @click="$emit('cancel')">
        Cancel
      </Button>
      <Button size="sm" @click="$emit('save', modelValue)">
        Save
      </Button>
    </div>
  </div>
</template>
