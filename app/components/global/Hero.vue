<template>
  <section id="hero" class="min-h-screen flex items-center justify-center relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen overflow-hidden">
    <!-- Spline 3D Background -->
    <div class="absolute inset-0 w-screen h-full z-0 max-w-none">
      <div class="relative w-screen h-full bg-black/40 max-w-none">
        <ClientOnly>
          <Spline
            :scene="sceneUrl"
            class="w-screen! h-full! max-w-none! spline-responsive"
            :style="{ width: '100vw', height: '100vh', maxWidth: 'none' }"
          />
        </ClientOnly>
      </div>
    </div>

    <!-- Content Overlay -->
    <div class="mx-auto w-full z-10 px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-24 xl:py-28 relative fixed:max-w-350 fixed:3xl:max-w-screen-2xl">
      <div class="max-w-5xl mx-auto">
        <!-- Main Content -->
        <div class="text-center space-y-4 sm:space-y-6 md:space-y-8">
          <!-- Main Heading -->
          <div class="space-y-2 md:space-y-3">
            <h1 class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight text-white drop-shadow-lg leading-tight">
              <span class="block whitespace-nowrap">Automate Your Business</span>
              <span class="block text-secondary text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl mt-2 sm:mt-3 whitespace-nowrap font-semibold drop-shadow-md">Scale Faster, Work Smarter</span>
            </h1>
          </div>

          <!-- Description -->
          <p class="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed backdrop-blur-sm bg-black/30 p-3 sm:p-4 md:p-6 rounded-lg">
            I build intelligent automation solutions that streamline your workflows and boost productivity. 
            Expert in Make.com, N8N, Zapier, and GoHighLevel (GHL) — delivering custom integrations and AI-powered systems tailored to your business needs.
          </p>
          
        </div>
      </div>
    </div>
  </section>
</template>



<script setup lang="ts">
const sceneUrl = "https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 2s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.spline-responsive {
  transform: scale(0.35);
  transform-origin: center center;
}

@media (min-width: 480px) {
  .spline-responsive {
    transform: scale(0.45);
  }
}

@media (min-width: 640px) {
  .spline-responsive {
    transform: scale(0.6);
  }
}

@media (min-width: 768px) {
  .spline-responsive {
    transform: scale(0.75);
  }
}

@media (min-width: 1024px) {
  .spline-responsive {
    transform: scale(1);
  }
}

@media (min-width: 1280px) {
  .spline-responsive {
    transform: scale(1.15);
  }
}
</style>