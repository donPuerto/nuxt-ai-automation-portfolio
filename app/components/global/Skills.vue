<template>
  <section class="py-16 bg-muted/50">
    <div class="container mx-auto px-4">
      <h2 class="text-3xl md:text-4xl font-bold text-center mb-12">Skills & Technologies</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <!-- Frontend -->
        <div class="bg-background p-6 rounded-lg shadow-sm">
          <h3 class="text-xl font-semibold mb-4 flex items-center">
            <svg class="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Frontend
          </h3>
          <div class="space-y-3">
            <div>
              <div class="flex justify-between mb-1">
                <span class="text-sm">Nuxt 4</span>
                <span class="text-sm">95%</span>
              </div>
              <Progress value="95" class="h-2" />
            </div>
            <div>
              <div class="flex justify-between mb-1">
                <span class="text-sm">Tailwind CSS 4</span>
                <span class="text-sm">90%</span>
              </div>
              <Progress value="90" class="h-2" />
            </div>
            <div>
              <div class="flex justify-between mb-1">
                <span class="text-sm">Vue 3</span>
                <span class="text-sm">92%</span>
              </div>
              <Progress value="92" class="h-2" />
            </div>
          </div>
        </div>

        <!-- Backend -->
        <div class="bg-background p-6 rounded-lg shadow-sm">
          <h3 class="text-xl font-semibold mb-4 flex items-center">
            <svg class="w-6 h-6 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
            Backend
          </h3>
          <div class="space-y-3">
            <div>
              <div class="flex justify-between mb-1">
                <span class="text-sm">Node.js</span>
                <span class="text-sm">88%</span>
              </div>
              <Progress value="88" class="h-2" />
            </div>
            <div>
              <div class="flex justify-between mb-1">
                <span class="text-sm">TypeScript</span>
                <span class="text-sm">85%</span>
              </div>
              <Progress value="85" class="h-2" />
            </div>
            <div>
              <div class="flex justify-between mb-1">
                <span class="text-sm">API Design</span>
                <span class="text-sm">90%</span>
              </div>
              <Progress value="90" class="h-2" />
            </div>
          </div>
        </div>

        <!-- AI/ML -->
        <div class="bg-background p-6 rounded-lg shadow-sm">
          <h3 class="text-xl font-semibold mb-4 flex items-center">
            <svg class="w-6 h-6 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI & Automation
          </h3>
          <div class="space-y-3">
            <div>
              <div class="flex justify-between mb-1">
                <span class="text-sm">Machine Learning</span>
                <span class="text-sm">82%</span>
              </div>
              <Progress value="82" class="h-2" />
            </div>
            <div>
              <div class="flex justify-between mb-1">
                <span class="text-sm">Python</span>
                <span class="text-sm">87%</span>
              </div>
              <Progress value="87" class="h-2" />
            </div>
            <div>
              <div class="flex justify-between mb-1">
                <span class="text-sm">Automation Tools</span>
                <span class="text-sm">91%</span>
              </div>
              <Progress value="91" class="h-2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// No script needed for static content
</script>