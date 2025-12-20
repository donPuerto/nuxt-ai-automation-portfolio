<template>
  <header class="sticky top-0 z-50 bg-background/80 backdrop-blur border-b">
    <nav class="container mx-auto flex items-center justify-between p-4">
      <NuxtLink to="/" class="text-xl font-bold hover:text-primary transition-colors">
        AI Portfolio
      </NuxtLink>

      <!-- Desktop Menu -->
      <ul class="hidden md:flex items-center space-x-6">
        <li v-for="route in routes" :key="route.path">
          <NuxtLink :to="route.path" class="hover:text-primary transition-colors">
            {{ route.name }}
          </NuxtLink>
        </li>
      </ul>

      <!-- Theme Toggle -->
      <Button @click="toggleTheme" variant="ghost" size="icon" class="ml-4">
        <span v-if="isDark">☀️</span>
        <span v-else>🌙</span>
      </Button>

      <!-- Mobile Menu Button -->
      <Button @click="isOpen = !isOpen" variant="ghost" size="icon" class="md:hidden">
        <span v-if="isOpen">✕</span>
        <span v-else>☰</span>
      </Button>
    </nav>

    <!-- Mobile Menu -->
    <div v-if="isOpen" class="md:hidden bg-background border-t">
      <ul class="flex flex-col space-y-4 p-4">
        <li v-for="route in routes" :key="route.path">
          <NuxtLink :to="route.path" class="block hover:text-primary" @click="isOpen = false">
            {{ route.name }}
          </NuxtLink>
        </li>
      </ul>
    </div>
  </header>
</template>

<script setup lang="ts">
const isOpen = ref(false)
const { isDark, toggleTheme } = useTheme()
</script>