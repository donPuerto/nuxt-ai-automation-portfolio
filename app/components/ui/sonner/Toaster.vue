<script setup lang="ts">
import type { ToasterProps } from 'vue-sonner'
import { Toaster as Sonner } from 'vue-sonner'
import 'vue-sonner/style.css'

defineOptions({
  inheritAttrs: false,
})

type SonnerTheme = NonNullable<ToasterProps['theme']>

const props = defineProps<ToasterProps>()
const colorMode = useColorMode()
const sonnerTheme = computed<SonnerTheme>(() => {
  if (colorMode.value === 'system') {
    return colorMode.preference as SonnerTheme
  }

  return colorMode.value as SonnerTheme
})

const toastOptions = computed<ToasterProps['toastOptions']>(() => ({
  unstyled: true,
  class: 'font-sans',
  classes: {
    toast: 'group toast-root rounded-xl border border-border bg-card text-card-foreground shadow-lg shadow-black/10 dark:shadow-black/30',
    title: 'text-sm font-semibold text-card-foreground',
    description: 'text-sm leading-6 text-muted-foreground',
    content: 'gap-1.5',
    actionButton: 'inline-flex h-8 items-center rounded-md bg-destructive px-3 text-xs font-medium text-destructive-foreground transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    cancelButton: 'inline-flex h-8 items-center rounded-md border border-border bg-muted px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    closeButton: 'rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
    success: 'border-emerald-500/25 bg-emerald-500/10 text-foreground',
    error: 'border-red-500/25 bg-red-500/10 text-foreground',
    warning: 'border-amber-500/25 bg-amber-500/10 text-foreground',
    info: 'border-primary/25 bg-primary/10 text-foreground',
  },
}))
</script>

<template>
  <Sonner
    v-bind="props"
    class="toaster group"
    :theme="sonnerTheme"
    :toast-options="toastOptions"
  />
</template>
