<template>
  <footer class="bg-muted py-12">
    <div class="container mx-auto px-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <!-- Brand -->
        <div class="md:col-span-1">
          <h3 class="text-lg font-semibold mb-4">{{ title }}</h3>
          <p class="text-sm text-muted-foreground">
            {{ description }} - Building the future with AI automation and modern web technologies.
          </p>
        </div>

        <!-- Quick Links -->
        <div>
          <h4 class="font-semibold mb-4">Quick Links</h4>
          <ul class="space-y-2 text-sm">
            <li v-for="route in routes" :key="route.path">
              <NuxtLink :to="route.path" class="hover:text-primary transition-colors">
                {{ route.name }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Technologies -->
        <div>
          <h4 class="font-semibold mb-4">Tech Stack</h4>
          <ul class="space-y-2 text-sm text-muted-foreground">
            <li>Nuxt 4</li>
            <li>Tailwind CSS 4</li>
            <li>shadcn-vue</li>
            <li>Inspira UI</li>
          </ul>
        </div>

        <!-- Social Links -->
        <div>
          <h4 class="font-semibold mb-4">Connect</h4>
          <div class="flex flex-col space-y-2 text-sm">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" class="hover:text-primary transition-colors">
              GitHub
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" class="hover:text-primary transition-colors">
              LinkedIn
            </a>
            <a href="mailto:your@email.com" class="hover:text-primary transition-colors">
              Email
            </a>
          </div>
        </div>
      </div>

      <div class="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
        <p>&copy; {{ currentYear }} {{ title }}. All rights reserved.</p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { title, description, routes } from '@@/shared'
const currentYear = new Date().getFullYear()
</script>
