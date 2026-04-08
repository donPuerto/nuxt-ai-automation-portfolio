<script setup lang="ts">
const props = defineProps<{
  disabled?: boolean
}>()

const emit = defineEmits<{
  files: [files: File[]]
}>()

const inputRef = ref<HTMLInputElement | null>(null)

const openPicker = () => {
  if (props.disabled) return
  inputRef.value?.click()
}

const onChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files ?? [])

  if (files.length > 0) {
    emit('files', files)
  }

  target.value = ''
}
</script>

<template>
  <div>
    <input
      ref="inputRef"
      type="file"
      multiple
      class="hidden"
      @change="onChange"
    >
    <Button
      type="button"
      variant="ghost"
      size="icon"
      class="size-8 rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      :disabled="disabled"
      aria-label="Attach files"
      @click="openPicker"
    >
      <Icon name="lucide:paperclip" class="size-4" />
    </Button>
  </div>
</template>
