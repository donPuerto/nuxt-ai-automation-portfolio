<template>
  <section id="hero" class="min-h-screen flex items-center justify-center relative overflow-hidden">
    <!-- Spline 3D Background -->
    <div class="absolute inset-0 w-full h-full z-0">
      <div class="relative w-full h-full overflow-hidden bg-black/96">
        <ClientOnly>
          <Spline
            :scene="sceneUrl"
            class="size-full"
          />
        </ClientOnly>
      </div>
    </div>

    <!-- Content Overlay -->
    <div class="container mx-auto z-10 px-4 py-20 relative">
      <div class="max-w-5xl mx-auto">
        <!-- Main Content -->
        <div class="text-center space-y-8">
          <!-- Greeting -->
          <div class="inline-block">
            <span class="px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium backdrop-blur-sm">
              👋 Welcome to my portfolio
            </span>
          </div>

          <!-- Main Heading -->
          <div class="space-y-4">
            <h1 class="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white drop-shadow-lg">
              AI Automation Engineer
            </h1>
          </div>

          <!-- Description -->
          <p class="text-lg md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed backdrop-blur-sm bg-black/20 p-4 rounded-lg">
            Specializing in intelligent workflow automation, AI-powered solutions, and enterprise integrations. 
            Building seamless automation systems with Make.com, N8N, and cutting-edge AI technologies.
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
        </div>
      </div>
    </div>

    <!-- Scroll Indicator -->
    <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce z-20">
      <a href="#about" @click.prevent="scrollToSection('about')" class="text-white/60 hover:text-white transition-colors">
        <Icon name="lucide:chevron-down" class="w-8 h-8" />
      </a>
    </div>
  </section>
</template>



<script setup lang="ts">
const sceneUrl = "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"

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