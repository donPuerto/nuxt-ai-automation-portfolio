<script setup lang="ts">
defineProps<{
  show: boolean
}>()
</script>

<template>
  <Transition
    enter-active-class="transition duration-150 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition duration-100 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="show"
      class="pointer-events-none absolute inset-0 z-20 rounded-[inherit] border border-primary/35 bg-primary/8"
      aria-hidden="true"
    >
      <div class="absolute inset-3 rounded-[inherit] border border-dashed border-primary/35" />
    </div>
  </Transition>
</template>
