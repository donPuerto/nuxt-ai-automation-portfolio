// TypeScript type definitions for the portfolio

export interface Project {
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

export interface Skill {
  name: string
  level: number // 0-100
  category: 'Frontend' | 'Backend' | 'AI'
}

export interface ContactForm {
  name: string
  email: string
  subject: string
  message: string
}

export interface ThemeConfig {
  isDark: boolean
  toggleTheme: () => void
}