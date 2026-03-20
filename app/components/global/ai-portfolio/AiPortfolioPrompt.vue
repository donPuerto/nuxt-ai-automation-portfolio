<script setup lang="ts">
const modelValue = defineModel<string>({ default: '' })

defineProps<{
  placeholder: string
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: []
}>()

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Enter' || event.shiftKey) {
    return
  }

  event.preventDefault()
  emit('submit')
}
</script>

<template>
  <div class="rounded-[1.75rem] border border-border/60 bg-card/70 p-2 shadow-[0_24px_60px_-32px_rgba(0,0,0,0.7)] backdrop-blur">
    <div class="flex items-center gap-3">
      <Input
        v-model="modelValue"
        :placeholder="placeholder"
        class="h-14 border-0 bg-transparent px-4 text-base shadow-none focus-visible:ring-0"
        @keydown="handleKeydown"
      />

      <Button
        type="button"
        size="icon"
        class="size-11 rounded-full"
        :disabled="loading || !modelValue.trim()"
        @click="emit('submit')"
      >
        <Icon v-if="loading" name="lucide:loader-circle" class="size-5 animate-spin" />
        <Icon v-else name="lucide:arrow-up" class="size-5" />
      </Button>
    </div>
  </div>
</template>
