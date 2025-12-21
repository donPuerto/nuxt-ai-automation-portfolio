<template>
  <div class="flex items-center gap-3">
    <div class="logo-container" aria-label="Logo initials">
      <GlowBorder
        :color="['#16a34a', '#0ea5e9', '#a855f7']"
        :border-radius="12"
        :border-width="2"
        :duration="3"
      />
      <div class="logo-inner">{{ initial }}</div>
    </div>
    <div v-if="!logoOnly && showTitle" class="logo-text hidden sm:flex flex-col justify-center leading-tight">
      <span class="text-[1.375rem] font-semibold text-foreground">{{ title }}</span>
      <span v-if="showRole" class="text-[0.65rem] tracking-[0.2em] text-muted-foreground uppercase">{{ role }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { title, description } from '@@/shared'

interface Props {
  logoOnly?: boolean
  showTitle?: boolean
  showRole?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  logoOnly: false,
  showTitle: true,
  showRole: true
})

const role = description

// Extract initials from title: "Don Puerto" -> "DP"
const initial = computed(() => 
  title.split(' ').map(word => word[0]).join('').toUpperCase()
)
</script>

<style scoped>
.logo-container {
  position: relative;
  height: 2.75rem; /* 44px */
  width: 2.75rem;
  border-radius: 0.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  isolation: isolate;
  overflow: hidden;
}

.logo-inner {
  position: relative;
  height: 100%;
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: inherit;
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 1rem;
  text-transform: uppercase;
  z-index: 10;
}

.logo-text {
  font-family: var(--font-sans);
  transition: opacity 0.3s ease;
}
</style>