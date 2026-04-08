<script setup lang="ts">
const props = withDefaults(defineProps<{
  open: boolean
  title?: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
}>(), {
  title: 'Confirm action',
  description: 'Are you sure you want to continue?',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: []
}>()
</script>

<template>
  <Dialog :open="props.open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ props.title }}</DialogTitle>
        <DialogDescription>{{ props.description }}</DialogDescription>
      </DialogHeader>
      <div class="flex justify-end gap-2 pt-2">
        <Button variant="outline" @click="emit('update:open', false)">
          {{ props.cancelLabel }}
        </Button>
        <Button @click="emit('confirm')">
          {{ props.confirmLabel }}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>
