<template>
  <div class="flex items-center gap-4">
    <div class="logo-border" :style="{ '--logo-gradient': gradient }" aria-label="Logo initials">
      <div class="logo-inner">{{ initial }}</div>
    </div>
    <div class="flex flex-col leading-tight">
      <span class="text-2xl font-semibold text-foreground">{{ title }}</span>
      <span class="text-sm tracking-[0.2em] text-muted-foreground uppercase">{{ role }}</span>
    </div>
    
  </div>
</template>



<script setup lang="ts">
import { title, description } from '@@/shared'

const role = description

// Extract initials from title: "Don Puerto" -> "DP"
const initial = title.split(' ').map(word => word[0]).join('').toUpperCase()

// Debug: Log the values
console.log('Title:', title)
console.log('Initial:', initial)

// Gradient uses CSS variables so theme can override --logo-accent-* at runtime
const gradient =
  'linear-gradient(120deg, var(--logo-accent-1, #16a34a), var(--logo-accent-2, #0ea5e9), var(--logo-accent-3, #16a34a))'
</script>

<style scoped>
.logo-border {
  position: relative;
  height: 3.5rem; /* 56px */
  width: 3.5rem;
  border-radius: 0.9rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  isolation: isolate;
}

.logo-border::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 3px;
  background: var(--logo-gradient);
  background-size: 300% 300%;
  animation: logo-gradient-move 6s linear infinite;
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  z-index: -1;
}

.logo-inner {
  position: relative;
  height: 100%;
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: inherit;
  background-color: var(--logo-bg, rgba(0, 0, 0, 0.04));
  color: var(--logo-fg, currentColor);
  font-weight: 700;
  font-size: 1.25rem;
  text-transform: uppercase;
}

@keyframes logo-gradient-move {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 300% 50%;
  }
}
</style>