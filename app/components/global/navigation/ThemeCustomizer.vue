<script setup lang="ts">
import { accentPresets } from '@@/shared'
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
  <div class="w-[320px] rounded-2xl border border-black/12 bg-white text-[#111111] shadow-[0_26px_80px_-36px_rgba(0,0,0,0.4)] dark:border-white/12 dark:bg-[#050506] dark:text-[#f5f5f5]">
    <div class="px-4 py-4">
      <div>
        <h2 class="text-sm font-semibold tracking-wide text-inherit">
          Appearance
        </h2>
        <p class="mt-1 text-xs leading-5 text-[#5f5a53] dark:text-[#c2b8aa]">
          Keep the site focused: choose light or dark mode, then pick from a small set of curated accent colors.
        </p>
      </div>

      <Separator class="my-4 bg-black/10 dark:bg-white/10" />

      <div class="space-y-3">
        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[#4f4943] dark:text-[#ddd3c6]">
            Mode
          </p>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="mode in modeOptions"
              :key="mode.id"
              type="button"
              class="flex items-center gap-2 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors"
              :class="currentMode === mode.id
                ? 'border-[#111111] bg-[#111111] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] dark:border-white dark:bg-white dark:text-[#111111]'
                : 'border-black/12 bg-[#f6f5f2] text-[#111111] hover:bg-[#eceae4] dark:border-white/12 dark:bg-[#101012] dark:text-[#f5f5f5] dark:hover:bg-[#18181b]'"
              @click="setTheme(mode.id, $event)"
            >
              <Icon :name="mode.icon" class="size-4.5" />
              <span>{{ mode.label }}</span>
            </button>
          </div>
        </div>

        <Separator class="bg-black/10 dark:bg-white/10" />

        <div class="space-y-3">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-[#4f4943] dark:text-[#ddd3c6]">
              Accent color
            </p>
            <p class="mt-1 text-xs leading-5 text-[#5f5a53] dark:text-[#c2b8aa]">
              A small studio palette only. No manual color editing, no visual overload.
            </p>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="preset in accentPresets"
              :key="preset.id"
              type="button"
              class="flex items-center justify-between rounded-xl border px-3 py-3 text-left transition-colors"
              :class="currentColor === preset.id
                ? 'border-[#111111] bg-[#f1efea] shadow-[inset_0_0_0_1px_rgba(17,17,17,0.04)] dark:border-white dark:bg-[#16161a]'
                : 'border-black/12 bg-[#fbfaf7] hover:bg-[#f0ede6] dark:border-white/12 dark:bg-[#0f1011] dark:hover:bg-[#17181b]'"
              @click="loadColor(preset.id)"
            >
              <div class="flex items-center gap-3">
                <span
                  class="block size-4 rounded-full border border-black/10 shadow-sm dark:border-white/10"
                  :style="{ backgroundColor: preset.swatch }"
                />
                <span class="text-sm font-medium text-inherit">
                  {{ preset.label }}
                </span>
              </div>

              <Icon
                v-if="currentColor === preset.id"
                name="lucide:check"
                class="size-4 text-[#111111] dark:text-white"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
