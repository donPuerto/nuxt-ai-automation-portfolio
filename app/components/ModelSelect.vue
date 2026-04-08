<script setup lang="ts">
const props = defineProps<{
  modelValue?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { models } = useModels()
</script>

<template>
  <Select :model-value="props.modelValue" @update:model-value="emit('update:modelValue', String($event))">
    <SelectTrigger class="h-9 w-[12rem] rounded-full">
      <SelectValue placeholder="Select model" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem
        v-for="model in models"
        :key="model.id"
        :value="model.id"
        :disabled="!model.available"
      >
        {{ model.label }}
      </SelectItem>
    </SelectContent>
  </Select>
</template>
