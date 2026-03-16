<script setup lang="ts">
import { accentPresets } from '@@/shared'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const { currentColor, loadColor } = useThemeManager()
const { colorMode, setTheme } = useTheme()

const modeOptions = [
  { id: 'light', label: 'Light', icon: 'lucide:sun' },
  { id: 'dark', label: 'Dark', icon: 'lucide:moon' },
] as const

const currentMode = computed(() => (colorMode.value === 'dark' ? 'dark' : 'light'))
</script>

<template>
  <div class="w-[320px] rounded-2xl bg-background">
    <div class="px-4 py-4">
      <div>
        <h2 class="text-sm font-semibold tracking-wide text-foreground">
          Appearance
        </h2>
        <p class="mt-1 text-xs leading-5 text-muted-foreground">
          Keep the site simple: choose light or dark mode, then pick a predefined accent color.
        </p>
      </div>

      <Separator class="my-4" />

      <div class="space-y-3">
        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Mode
          </p>
          <div class="grid grid-cols-2 gap-2">
            <Button
              v-for="mode in modeOptions"
              :key="mode.id"
              :variant="currentMode === mode.id ? 'default' : 'outline'"
              class="justify-start rounded-xl"
              @click="setTheme(mode.id, $event)"
            >
              <Icon :name="mode.icon" class="size-4" />
              <span>{{ mode.label }}</span>
            </Button>
          </div>
        </div>

        <Separator />

        <div class="space-y-3">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Accent color
            </p>
            <p class="mt-1 text-xs leading-5 text-muted-foreground">
              Predefined shadcn-style presets only. No manual color editing.
            </p>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="preset in accentPresets"
              :key="preset.id"
              type="button"
              class="flex items-center justify-between rounded-xl border px-3 py-3 text-left transition-colors"
              :class="currentColor === preset.id ? 'border-primary bg-primary/8' : 'border-border/60 bg-card hover:bg-accent/50'"
              @click="loadColor(preset.id)"
            >
              <div class="flex items-center gap-3">
                <span
                  class="block size-4 rounded-full border border-black/10 shadow-sm"
                  :style="{ backgroundColor: preset.swatch }"
                />
                <span class="text-sm font-medium text-foreground">
                  {{ preset.label }}
                </span>
              </div>

              <Icon
                v-if="currentColor === preset.id"
                name="lucide:check"
                class="size-4 text-primary"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
