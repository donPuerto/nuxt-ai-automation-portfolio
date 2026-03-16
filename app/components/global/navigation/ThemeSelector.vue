<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="icon" class="relative rounded-full">
        <Icon name="lucide:palette" class="w-5 h-5" />
        <span
          class="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border border-background shadow-sm"
          :style="{ backgroundColor: selectedAccent?.swatch ?? '#3f3f46' }"
        />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-auto p-0">
      <ThemeCustomizer />
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang="ts">
import { accentPresets } from '@@/shared'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const { currentColor } = useThemeManager()

const selectedAccent = computed(() =>
  accentPresets.find(preset => preset.id === currentColor.value),
)
</script>
