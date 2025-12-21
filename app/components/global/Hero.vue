<template>
  <section id="hero" class="min-h-screen flex items-center justify-center relative overflow-hidden py-4">
    <div class="container mx-auto z-10 px-4">
      <div class="flex flex-col items-center justify-center gap-8 w-full">
        <!-- Introduction Text -->
        <div class="text-center max-w-4xl w-full px-4 space-y-4">
          <h1 class="text-4xl md:text-6xl font-bold tracking-tight">
            AI Automation Engineer
          </h1>
          <p class="text-xl md:text-2xl text-muted-foreground font-medium">
            Transforming Business Operations Through Intelligent Automation
          </p>
          <p class="text-base md:text-lg text-foreground/80 max-w-2xl mx-auto">
            Empowering businesses to scale efficiently with cutting-edge AI solutions, 
            seamless workflow automation, and enterprise-grade integrations
          </p>
        </div>
      </div>
    </div>

    <!-- Scroll Indicator -->
    <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
      <a href="#about" @click.prevent="scrollToSection('about')" class="text-foreground/60 hover:text-foreground transition-colors">
        <Icon name="lucide:chevron-down" class="w-6 h-6" />
      </a>
    </div>
  </section>
</template>

<script setup lang="ts">
  "make",
  "n8n",
  "zapier",
  "typescript",
  "javascript",
  'oddo',
  "python",
  "react",
  "vuedotjs",
  "nuxtdotjs",
  "nodedotjs",
  'woo',
  "nextdotjs",
  "tailwindcss",
  "openai",
  "googlecloud",
  "amazonaws",
  "vercel",
  "docker",
  'hostinger',
  "postgresql",
  "mongodb",
  "redis",
  "github",
  "figma",
  "notion",
  "slack",
  "discord",
  "airtable",
  'wordpress',
  "stripe",
  "supabase",
  "cloudflare",
]

const imageUrls = slugs.map((slug) => `https://cdn.simpleicons.org/${slug}/ffffff`)

const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 2s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>