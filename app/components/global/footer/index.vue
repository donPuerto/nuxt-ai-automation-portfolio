<template>
  <footer class="border-t bg-background/50 backdrop-blur-sm">
    <div class="mx-auto w-full px-4 py-12 fixed:max-w-350 fixed:3xl:max-w-screen-2xl">
      <div class="mb-8 text-center">
        <h4 class="mb-4 text-lg font-medium">Connect with me</h4>
        <div class="flex justify-center gap-4">
          <a
            :href="personalInfo.social.linkedin"
            target="_blank"
            rel="noopener noreferrer"
            class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 transition-colors hover:bg-primary/20"
            aria-label="LinkedIn"
          >
            <Icon name="lucide:linkedin" class="h-5 w-5" />
          </a>
          <a
            :href="personalInfo.social.facebook"
            target="_blank"
            rel="noopener noreferrer"
            class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 transition-colors hover:bg-primary/20"
            aria-label="Facebook"
          >
            <Icon name="lucide:facebook" class="h-5 w-5" />
          </a>
          <a
            :href="personalInfo.social.github"
            target="_blank"
            rel="noopener noreferrer"
            class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 transition-colors hover:bg-primary/20"
            aria-label="GitHub"
          >
            <Icon name="lucide:github" class="h-5 w-5" />
          </a>
          <a
            :href="personalInfo.social.x"
            target="_blank"
            rel="noopener noreferrer"
            class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 transition-colors hover:bg-primary/20"
            aria-label="X (Twitter)"
          >
            <Icon name="lucide:twitter" class="h-5 w-5" />
          </a>
        </div>
      </div>

      <div class="border-t pt-8">
        <div class="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div class="flex items-center gap-4">
            <Logo :logo-only="true" :show-title="false" :show-role="false" />
            <p class="text-sm text-muted-foreground">{{ copyrightLine }}</p>
          </div>

          <div class="flex flex-col items-center gap-4 text-sm text-muted-foreground sm:flex-row">
            <a :href="`mailto:${personalInfo.email}`" class="flex items-center gap-2 transition-colors hover:text-foreground">
              <Icon name="lucide:mail" class="h-4 w-4" />
              {{ personalInfo.email }}
            </a>
            <a :href="`tel:${personalInfo.phone}`" class="flex items-center gap-2 transition-colors hover:text-foreground">
              <Icon name="lucide:phone" class="h-4 w-4" />
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
const copyrightLine = computed(() => `© ${currentYear} ${personalInfo.name}. All rights reserved.`)
</script>
