<template>
  <Button 
    @click="toggleLayout" 
    variant="ghost" 
    size="icon"
    :title="isLayoutFixed ? 'Switch to Full Layout' : 'Switch to Fixed Layout'"
  >
    <Icon v-if="isLayoutFixed" name="lucide:maximize-2" class="w-5 h-5" />
    <Icon v-else name="lucide:minimize-2" class="w-5 h-5" />
  </Button>
</template>

<script setup lang="ts">
const { isLayoutFixed, toggleLayout } = useLayoutManager()
</script>
