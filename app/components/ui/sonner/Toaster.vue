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
</script>

<template>
  <Sonner
    v-bind="props"
    class="toaster group"
    :theme="sonnerTheme"
  />
</template>
