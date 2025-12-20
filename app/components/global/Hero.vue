<template>
  <section id="hero" class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 text-white relative overflow-hidden">
    <!-- Background Animation (Placeholder for Inspira UI) -->
    <div class="absolute inset-0 opacity-20">
      <FluidCursor />
    </div>

    <div class="container mx-auto text-center z-10 px-4">
      <h1 class="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
        Welcome to My AI Automation Portfolio
      </h1>
      <p class="text-lg md:text-xl mb-8 max-w-2xl mx-auto opacity-90">
        Showcasing cutting-edge AI projects built with Nuxt 4, Tailwind CSS 4, and modern web technologies.
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <Button size="lg" @click="scrollToSection('about')" class="bg-white text-purple-600 hover:bg-gray-100">
          Learn More
        </Button>
        <Button size="lg" variant="outline" @click="scrollToSection('contact')" class="border-white text-white hover:bg-white hover:text-purple-600">
          Get In Touch
        </Button>
      </div>
    </div>

    <!-- Scroll Indicator -->
    <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
      <a href="#about" @click.prevent="scrollToSection('about')" class="text-white">
        ↓
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