<template>
  <div class="relative" data-theme-selector>
    <Button @click="isOpen = !isOpen" variant="ghost" size="icon" class="relative">
      <Icon v-if="selectedTheme" :name="selectedTheme.icon" class="w-5 h-5" />
    </Button>

    <div
      v-if="isOpen"
      class="absolute right-0 mt-2 w-48 rounded-lg border bg-popover p-2 shadow-lg z-50"
      @click.stop
    >
      <div class="space-y-1">
        <button
          v-for="theme in themes"
          :key="theme.id"
          @click="selectTheme(theme.id)"
          class="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors text-left"
          :class="{ 'bg-accent': currentTheme === theme.id }"
        >
          <Icon :name="theme.icon" class="w-5 h-5" />
          <span class="text-sm">{{ theme.name }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { themes } from '@@/shared'

const { currentTheme, loadTheme } = useThemeManager()
const isOpen = ref(false)

const selectedTheme = computed(() => 
  themes.find(t => t.id === currentTheme.value)
)

const selectTheme = (themeId: string) => {
  loadTheme(themeId)
  isOpen.value = false
}

// Close dropdown when clicking outside
onMounted(() => {
  const handleClickOutside = (e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (isOpen.value && !target.closest('[data-theme-selector]')) {
      isOpen.value = false
    }
  }
  document.addEventListener('click', handleClickOutside)
  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })
})
</script>
