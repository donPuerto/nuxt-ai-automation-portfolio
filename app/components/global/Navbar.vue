<template>
  <header class="sticky top-0 z-50 bg-background/80 backdrop-blur border-b">
    <nav class="container mx-auto flex items-center justify-between p-4">
      <NuxtLink to="/" class="text-xl font-bold hover:text-primary transition-colors">
        AI Portfolio
      </NuxtLink>

      <!-- Desktop Menu -->
      <ul class="hidden md:flex items-center space-x-6">
        <li>
          <NuxtLink to="/" class="hover:text-primary transition-colors">
            Home
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/about" class="hover:text-primary transition-colors">
            About
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/portfolio" class="hover:text-primary transition-colors">
            Portfolio
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/contact" class="hover:text-primary transition-colors">
            Contact
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
        <li>
          <NuxtLink to="/" class="block hover:text-primary" @click="isOpen = false">
            Home
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/about" class="block hover:text-primary" @click="isOpen = false">
            About
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/portfolio" class="block hover:text-primary" @click="isOpen = false">
            Portfolio
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/contact" class="block hover:text-primary" @click="isOpen = false">
            Contact
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