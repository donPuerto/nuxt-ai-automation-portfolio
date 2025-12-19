<template>
  <section id="about" class="py-16 bg-background">
    <div class="container mx-auto px-4">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <!-- Image -->
        <div class="order-2 lg:order-1">
          <img
            src="/images/profile.jpg"
            alt="Profile"
            class="w-full max-w-md mx-auto rounded-lg shadow-lg"
            width="400"
            height="400"
          />
        </div>

        <!-- Content -->
        <div class="order-1 lg:order-2">
          <h2 class="text-3xl md:text-4xl font-bold mb-6">About Me</h2>
          <p class="text-lg mb-6 text-muted-foreground">
            I'm a passionate developer specializing in AI automation and modern web technologies.
            With expertise in Nuxt 4, Tailwind CSS 4, and cutting-edge UI frameworks, I create
            innovative solutions that push the boundaries of what's possible.
          </p>
          <p class="text-lg mb-8 text-muted-foreground">
            My portfolio showcases projects that leverage artificial intelligence to automate
            processes, enhance user experiences, and solve real-world problems.
          </p>

          <!-- Skills Preview -->
          <div class="mb-8">
            <h3 class="text-xl font-semibold mb-4">Key Skills</h3>
            <div class="flex flex-wrap gap-2">
              <Badge variant="secondary">Nuxt 4</Badge>
              <Badge variant="secondary">Tailwind CSS 4</Badge>
              <Badge variant="secondary">TypeScript</Badge>
              <Badge variant="secondary">AI/ML</Badge>
              <Badge variant="secondary">Automation</Badge>
            </div>
          </div>

          <Button size="lg" @click="scrollToSection('portfolio')">
            View My Work
          </Button>
        </div>
      </div>
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