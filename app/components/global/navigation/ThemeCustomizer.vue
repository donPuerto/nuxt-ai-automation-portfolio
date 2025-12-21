<template>
  <div class="space-y-4 p-4 min-w-[320px]">
    <!-- Themes Section -->
    <div>
      <h3 class="text-sm font-semibold mb-3">Themes</h3>
      <Select v-model="currentTheme" @update:model-value="(value) => value && loadTheme(value as string)">
        <SelectTrigger class="w-full">
          <SelectValue placeholder="Select a theme">
            {{ selectedTheme?.label }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem
              v-for="theme in styleThemes"
              :key="theme.id"
              :value="theme.id"
            >
              <div class="flex items-center gap-2">
                <Icon :name="theme.icon" class="w-4 h-4" />
                {{ theme.label }}
              </div>
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>

    <Separator />

    <!-- Color Section -->
    <div>
      <h3 class="text-sm font-semibold mb-3">Color</h3>
      <div class="grid grid-cols-2 gap-2">
        <Button
          v-for="color in colorThemes"
          :key="color.id"
          variant="outline"
          @click="loadColor(color.id)"
          class="flex items-center gap-2 justify-start px-3 py-2"
          :class="[
            currentColor === color.id 
              ? 'border-primary ring-2 ring-primary ring-offset-1' 
              : ''
          ]"
        >
          <div 
            class="w-5 h-5 rounded-full border-2 shrink-0"
            :class="getColorClass(color.id)"
          />
          <span class="text-sm">{{ color.label }}</span>
        </Button>
      </div>
    </div>

    <Separator />

    <!-- Radius Section -->
    <div>
      <h3 class="text-sm font-semibold mb-3">Radius</h3>
      <div class="flex gap-2">
        <Button
          v-for="radius in radiusOptions"
          :key="radius.value"
          :variant="currentRadius === radius.value ? 'default' : 'outline'"
          @click="loadRadius(radius.value)"
          class="flex-1"
        >
          {{ radius.label }}
        </Button>
      </div>
    </div>

    <Separator />

    <!-- Theme Mode Section -->
    <div>
      <h3 class="text-sm font-semibold mb-3">Mode</h3>
      <div class="flex gap-2">
        <Button
          :variant="!isDark ? 'default' : 'outline'"
          @click="setMode('light')"
          class="flex-1"
        >
          <Icon name="lucide:sun" class="w-4 h-4" />
          <span>Light</span>
        </Button>
        <Button
          :variant="isDark ? 'default' : 'outline'"
          @click="setMode('dark')"
          class="flex-1"
        >
          <Icon name="lucide:moon" class="w-4 h-4" />
          <span>Dark</span>
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { styleThemes, colorThemes, radiusOptions } from '@@/shared'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'

const { currentTheme, currentColor, currentRadius, loadTheme, loadColor, loadRadius } = useThemeManager()
const { isDark, toggleTheme } = useTheme()

const selectedTheme = computed(() => 
  styleThemes.find(t => t.id === currentTheme.value)
)

const setMode = (mode: 'light' | 'dark') => {
  if ((mode === 'dark' && !isDark.value) || (mode === 'light' && isDark.value)) {
    toggleTheme()
  }
}

// Map color IDs to actual Tailwind classes
const getColorClass = (colorId: string) => {
  const colorMap: Record<string, string> = {
    'zinc': 'bg-zinc-500 border-zinc-600',
    'rose': 'bg-rose-500 border-rose-600',
    'blue': 'bg-blue-500 border-blue-600',
    'green': 'bg-green-500 border-green-600',
    'orange': 'bg-orange-500 border-orange-600',
    'red': 'bg-red-500 border-red-600',
    'slate': 'bg-slate-500 border-slate-600',
    'stone': 'bg-stone-500 border-stone-600',
    'gray': 'bg-gray-500 border-gray-600',
    'neutral': 'bg-neutral-500 border-neutral-600',
    'yellow': 'bg-yellow-500 border-yellow-600',
    'violet': 'bg-violet-500 border-violet-600',
    'amber': 'bg-amber-500 border-amber-600',
    'purple': 'bg-purple-500 border-purple-600',
    'teal': 'bg-teal-500 border-teal-600'
  }
  return colorMap[colorId] || 'bg-gray-500 border-gray-600'
}
</script>
