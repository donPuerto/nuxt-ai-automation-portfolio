<template>
  <div class="!m-0 !p-0">
    <Hero />
    <section class="py-16">
      <div class="mx-auto w-full px-4 text-center fixed:max-w-350 fixed:3xl:max-w-screen-2xl">
        <h2 class="text-3xl md:text-4xl font-bold mb-8">Explore My Work</h2>
        <p class="text-muted-foreground mb-12 max-w-2xl mx-auto">
          Discover my expertise in AI automation, modern web development, and innovative solutions.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <Button as-child variant="outline" size="lg">
            <NuxtLink to="/about">
              Learn About Me
            </NuxtLink>
          </Button>
          <Button as-child variant="outline" size="lg">
            <NuxtLink to="/contact">
              Get In Touch
            </NuxtLink>
          </Button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// Landing page with hero and navigation to other sections
</script>
