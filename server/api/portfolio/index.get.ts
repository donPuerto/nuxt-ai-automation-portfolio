export default defineEventHandler(async (event) => {
  // Simulate fetching portfolio data from a database or CMS
  // In a real app, this would connect to your data source

  const projects = [
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
    // Add more projects
  ]

  return {
    projects,
    total: projects.length
  }
})