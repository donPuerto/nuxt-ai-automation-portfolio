<template>
  <div class="flex items-center gap-3">
    <div class="logo-border" aria-label="Logo initials">
      <div class="logo-inner">{{ initial }}</div>
    </div>
    <div v-if="!logoOnly && showTitle" class="logo-text flex flex-col justify-center leading-tight hidden sm:flex">
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
.logo-border {
  position: relative;
  height: 2.75rem; /* 44px */
  width: 2.75rem;
  border-radius: 0.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  isolation: isolate;
}

.logo-border::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  padding: 2px;
  background: linear-gradient(
    90deg,
    var(--logo-accent-1, #16a34a) 0%,
    var(--logo-accent-2, #0ea5e9) 50%,
    var(--logo-accent-3, #a855f7) 100%
  );
  background-size: 200% 100%;
  animation: logo-gradient-move 3s linear infinite;
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
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
  font-weight: 700;
  font-size: 1rem;
  text-transform: uppercase;
}

.logo-text {
  transition: opacity 0.3s ease;
}

@keyframes logo-gradient-move {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 200% 50%;
  }
}
</style>