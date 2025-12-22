<template>
  <footer class="border-t bg-background/50 backdrop-blur-sm">
    <div class="mx-auto w-full px-4 py-12 fixed:max-w-350 fixed:3xl:max-w-screen-2xl">
      <!-- Connect with me Section -->
      <div class="text-center mb-8">
        <h4 class="text-lg font-medium mb-4">Connect with me</h4>
        <div class="flex justify-center gap-4">
          <a 
            :href="personalInfo.social.linkedin" 
            target="_blank" 
            rel="noopener noreferrer"
            class="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
            aria-label="LinkedIn"
          >
            <Icon name="lucide:linkedin" class="w-5 h-5" />
          </a>
          <a 
            :href="personalInfo.social.facebook" 
            target="_blank" 
            rel="noopener noreferrer"
            class="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
            aria-label="Facebook"
          >
            <Icon name="lucide:facebook" class="w-5 h-5" />
          </a>
          <a 
            :href="personalInfo.social.github" 
            target="_blank" 
            rel="noopener noreferrer"
            class="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
            aria-label="GitHub"
          >
            <Icon name="lucide:github" class="w-5 h-5" />
          </a>
          <a 
            :href="personalInfo.social.x" 
            target="_blank" 
            rel="noopener noreferrer"
            class="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
            aria-label="X (Twitter)"
          >
            <Icon name="lucide:twitter" class="w-5 h-5" />
          </a>
        </div>
      </div>

      <!-- Bottom Section -->
      <div class="border-t pt-8">
        <div class="flex flex-col md:flex-row justify-between items-center gap-4">
          <!-- Logo & Copyright -->
          <div class="flex items-center gap-4">
            <Logo :logo-only="true" :show-title="false" :show-role="false" />
            <p class="text-sm text-muted-foreground">
              © {{ currentYear }} {{ personalInfo.name }}. All rights reserved.
            </p>
          </div>

          <!-- Contact Info -->
          <div class="flex flex-col sm:flex-row items-center gap-4 text-sm text-muted-foreground">
            <a :href="`mailto:${personalInfo.email}`" class="flex items-center gap-2 hover:text-foreground transition-colors">
              <Icon name="lucide:mail" class="w-4 h-4" />
              {{ personalInfo.email }}
            </a>
            <a :href="`tel:${personalInfo.phone}`" class="flex items-center gap-2 hover:text-foreground transition-colors">
              <Icon name="lucide:phone" class="w-4 h-4" />
              {{ personalInfo.phone }}
            </a>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { personalInfo } from '@@/shared'
const currentYear = new Date().getFullYear()
</script>
