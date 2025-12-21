<template>
  <section id="hero" class="min-h-screen flex items-center justify-center relative overflow-hidden">
    <div class="container mx-auto z-10 px-4 py-20">
      <div class="max-w-5xl mx-auto">
        <!-- Main Content -->
        <div class="text-center space-y-8">
          <!-- Greeting -->
          <div class="inline-block">
            <span class="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              👋 Welcome to my portfolio
            </span>
          </div>

          <!-- Main Heading -->
          <div class="space-y-4">
            <h1 class="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight">
              I'm <span class="text-primary">Don Puerto</span>
            </h1>
            <h2 class="text-3xl md:text-4xl lg:text-5xl font-semibold text-muted-foreground">
              AI Automation Engineer
            </h2>
          </div>

          <!-- Description -->
          <p class="text-lg md:text-xl text-foreground/80 max-w-3xl mx-auto leading-relaxed">
            Specializing in intelligent workflow automation, AI-powered solutions, and enterprise integrations. 
            I help businesses <span class="font-semibold text-primary">save 10+ hours weekly</span> by building 
            seamless automation systems with Make.com, N8N, and cutting-edge AI technologies.
          </p>

          <!-- CTA Buttons -->
          <div class="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" as-child class="text-base">
              <NuxtLink to="/contact">
                <Icon name="lucide:mail" class="w-5 h-5 mr-2" />
                Get In Touch
              </NuxtLink>
            </Button>
            <Button size="lg" variant="outline" as-child class="text-base">
              <NuxtLink to="/about">
                <Icon name="lucide:user" class="w-5 h-5 mr-2" />
                About Me
              </NuxtLink>
            </Button>
          </div>

          <!-- Quick Stats -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 max-w-3xl mx-auto">
            <div class="p-6 rounded-lg bg-background/50 backdrop-blur-sm border border-border/50">
              <div class="text-3xl font-bold text-primary mb-2">10+</div>
              <div class="text-sm text-muted-foreground">Hours Saved Weekly</div>
            </div>
            <div class="p-6 rounded-lg bg-background/50 backdrop-blur-sm border border-border/50">
              <div class="text-3xl font-bold text-primary mb-2">100%</div>
              <div class="text-sm text-muted-foreground">Client Satisfaction</div>
            </div>
            <div class="p-6 rounded-lg bg-background/50 backdrop-blur-sm border border-border/50">
              <div class="text-3xl font-bold text-primary mb-2">24/7</div>
              <div class="text-sm text-muted-foreground">Automation Support</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Scroll Indicator -->
    <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
      <a href="#about" @click.prevent="scrollToSection('about')" class="text-foreground/60 hover:text-foreground transition-colors">
        <Icon name="lucide:chevron-down" class="w-8 h-8" />
      </a>
    </div>
  </section>
</template>



<script setup lang="ts">
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