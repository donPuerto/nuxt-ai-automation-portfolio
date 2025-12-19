<template>
  <section id="portfolio" class="py-16 bg-muted/50">
    <div class="container mx-auto px-4">
      <h2 class="text-3xl md:text-4xl font-bold text-center mb-12">My Portfolio</h2>

      <!-- Filter Buttons -->
      <div class="flex flex-wrap justify-center gap-2 mb-8">
        <Button
          v-for="category in categories"
          :key="category"
          @click="activeCategory = category"
          :variant="activeCategory === category ? 'default' : 'outline'"
          size="sm"
        >
          {{ category }}
        </Button>
      </div>

      <!-- Projects Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <Card
          v-for="project in filteredProjects"
          :key="project.id"
          class="group hover:shadow-lg transition-shadow"
        >
          <CardHeader class="p-0">
            <img
              :src="project.image"
              :alt="project.title"
              class="w-full h-48 object-cover rounded-t-lg group-hover:scale-105 transition-transform"
            />
          </CardHeader>
          <CardContent class="p-6">
            <div class="flex items-center justify-between mb-2">
              <Badge variant="secondary">{{ project.category }}</Badge>
              <div class="flex items-center text-sm text-muted-foreground">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ project.date }}
              </div>
            </div>
            <CardTitle class="mb-2">{{ project.title }}</CardTitle>
            <CardDescription class="mb-4">{{ project.description }}</CardDescription>
            <div class="flex flex-wrap gap-1 mb-4">
              <Badge v-for="tech in project.technologies" :key="tech" variant="outline" class="text-xs">
                {{ tech }}
              </Badge>
            </div>
            <div class="flex gap-2">
              <Button as-child size="sm">
                <a :href="project.demoUrl" target="_blank" rel="noopener">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Demo
                </a>
              </Button>
              <Button as-child variant="outline" size="sm">
                <a :href="project.githubUrl" target="_blank" rel="noopener">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Code
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Load More (if needed) -->
      <div v-if="filteredProjects.length > 6" class="text-center mt-8">
        <Button variant="outline">Load More Projects</Button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
interface Project {
  id: number
  title: string
  description: string
  image: string
  category: string
  technologies: string[]
  demoUrl: string
  githubUrl: string
  date: string
}

const activeCategory = ref('All')
const categories = ['All', 'AI', 'Automation', 'Web App', 'Tool']

const projects = ref<Project[]>([
  {
    id: 1,
    title: 'AI Chat Assistant',
    description: 'An intelligent chatbot powered by machine learning for customer support automation.',
    image: '/images/project1.jpg',
    category: 'AI',
    technologies: ['Python', 'TensorFlow', 'Nuxt', 'API'],
    demoUrl: 'https://demo1.com',
    githubUrl: 'https://github.com/project1',
    date: '2024'
  },
  {
    id: 2,
    title: 'Workflow Automator',
    description: 'Streamline business processes with AI-driven automation tools.',
    image: '/images/project2.jpg',
    category: 'Automation',
    technologies: ['Node.js', 'AI', 'Workflow Engine'],
    demoUrl: 'https://demo2.com',
    githubUrl: 'https://github.com/project2',
    date: '2024'
  },
  // Add more projects as needed
])

const filteredProjects = computed(() => {
  if (activeCategory.value === 'All') return projects.value
  return projects.value.filter(project => project.category === activeCategory.value)
})
</script>