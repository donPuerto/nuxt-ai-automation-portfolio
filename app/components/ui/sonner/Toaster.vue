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
    toast: 'group toast-root relative flex w-[min(92vw,360px)] items-start gap-2.5 rounded-xl border border-border/80 bg-surface/96 px-4 py-3 text-surface-foreground shadow-[0_14px_36px_-22px_hsl(0_0%_0%_/_0.42)] backdrop-blur-xl',
    title: 'pr-6 text-sm font-semibold leading-5 text-surface-foreground',
    description: 'mt-1 pr-6 text-sm leading-5 text-surface-foreground/78 whitespace-normal break-words',
    content: 'flex min-w-0 flex-1 flex-col gap-0',
    icon: 'mt-0.5 shrink-0 text-surface-foreground/75',
    successIcon: 'text-surface-foreground/75',
    errorIcon: 'text-destructive',
    warningIcon: 'text-primary/85',
    infoIcon: 'text-surface-foreground/75',
    actionButton: 'mt-2 inline-flex h-8 items-center rounded-md border border-border/70 bg-accent px-3 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45',
    cancelButton: 'mt-2 inline-flex h-8 items-center rounded-md border border-border/70 bg-transparent px-3 text-xs font-medium text-surface-foreground/82 transition-colors hover:bg-accent/55 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35',
    closeButton: 'absolute right-2 top-2 inline-flex size-6 items-center justify-center rounded-md border border-border/60 bg-transparent text-surface-foreground/55 transition-colors hover:bg-accent/55 hover:text-accent-foreground',
    success: 'border-border/80 bg-surface/96 text-surface-foreground',
    error: 'border-destructive/30 bg-surface/96 text-surface-foreground',
    warning: 'border-primary/30 bg-surface/96 text-surface-foreground',
    info: 'border-border/80 bg-surface/96 text-surface-foreground',
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
