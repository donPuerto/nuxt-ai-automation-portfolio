<template>
  <footer class="bg-muted py-12">
    <div class="container mx-auto px-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <!-- Brand -->
        <div class="md:col-span-1">
          <h3 class="text-lg font-semibold mb-4">AI Portfolio</h3>
          <p class="text-sm text-muted-foreground">
            Building the future with AI automation and modern web technologies.
          </p>
        </div>

        <!-- Quick Links -->
        <div>
          <h4 class="font-semibold mb-4">Quick Links</h4>
          <ul class="space-y-2 text-sm">
            <li>
              <a href="#hero" class="hover:text-primary transition-colors" @click.prevent="scrollToSection('hero')">
                Home
              </a>
            </li>
            <li>
              <a href="#about" class="hover:text-primary transition-colors" @click.prevent="scrollToSection('about')">
                About
              </a>
            </li>
            <li>
              <a href="#portfolio" class="hover:text-primary transition-colors" @click.prevent="scrollToSection('portfolio')">
                Portfolio
              </a>
            </li>
            <li>
              <a href="#contact" class="hover:text-primary transition-colors" @click.prevent="scrollToSection('contact')">
                Contact
              </a>
            </li>
          </ul>
        </div>

        <!-- Technologies -->
        <div>
          <h4 class="font-semibold mb-4">Tech Stack</h4>
          <ul class="space-y-2 text-sm text-muted-foreground">
            <li>Nuxt 4</li>
            <li>Tailwind CSS 4</li>
            <li>shadcn/ui</li>
            <li>Inspira UI</li>
          </ul>
        </div>

        <!-- Social Links -->
        <div>
          <h4 class="font-semibold mb-4">Connect</h4>
          <div class="flex space-x-4">
            <a href="https://github.com" target="_blank" class="hover:text-primary transition-colors">
              GitHub
            </a>
            <a href="https://linkedin.com" target="_blank" class="hover:text-primary transition-colors">
              LinkedIn
            </a>
            <a href="mailto:your@email.com" class="hover:text-primary transition-colors">
              Email
            </a>
          </div>
        </div>
      </div>

      <div class="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
        <p>&copy; 2025 Your Name. All rights reserved.</p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>