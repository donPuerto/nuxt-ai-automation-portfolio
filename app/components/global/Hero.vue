<template>
  <section id="hero" class="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] flex min-h-screen w-screen items-center justify-center overflow-hidden">
    <!-- Spline 3D Background -->
    <div class="absolute inset-0 z-0 h-full w-screen max-w-none">
      <div class="relative h-full w-screen max-w-none bg-black/40">
        <ClientOnly>
          <AsyncSpline
            :scene="sceneUrl"
            class="spline-responsive h-full! w-screen! max-w-none!"
            :style="{ width: '100vw', height: '100vh', maxWidth: 'none' }"
          />
        </ClientOnly>
      </div>
    </div>

    <!-- Content Overlay -->
    <div class="fixed:3xl:max-w-screen-2xl fixed:max-w-350 relative z-10 mx-auto w-full px-4 py-12 sm:px-6 sm:py-16 md:py-20 lg:px-8 lg:py-24 xl:py-28">
      <div class="mx-auto max-w-5xl">
        <!-- Main Content -->
        <div class="space-y-4 text-center sm:space-y-6 md:space-y-8">
          <!-- Main Heading -->
          <div class="space-y-2 md:space-y-3">
            <h1 class="text-4xl font-bold leading-tight tracking-tight text-white drop-shadow-lg sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
              <span class="block whitespace-nowrap">Automate Your Business</span>
              <span class="mt-2 block whitespace-nowrap text-2xl font-semibold text-secondary drop-shadow-md sm:mt-3 sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">Scale Faster, Work Smarter</span>
            </h1>
          </div>

          <!-- Description -->
          <p class="mx-auto max-w-3xl rounded-lg bg-black/30 p-3 text-base leading-relaxed text-white/90 backdrop-blur-sm sm:p-4 sm:text-lg md:p-6 md:text-xl lg:text-2xl">
            I build intelligent automation solutions that streamline your workflows and boost productivity.
            Expert in Make.com, N8N, Zapier, and GoHighLevel (GHL) — delivering custom integrations and AI-powered automation projects tailored to your business needs.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const AsyncSpline = defineAsyncComponent(() => import('~/components/ui/spline/Spline.vue'))

const sceneUrl = 'https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode'
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
