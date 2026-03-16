import { catalogCategories } from './categories'
import { catalogProjects } from './projects'

export * from './types'
export * from './categories'
export * from './content'
export * from './projects'

export const getCategoryBySlug = (slug: string) =>
  catalogCategories.find(category => category.slug === slug)

export const getProjectsByCategory = (categorySlug: string) =>
  catalogProjects.filter(project => project.category === categorySlug)

export const getProjectBySlugs = (categorySlug: string, projectSlug: string) =>
  catalogProjects.find(project => project.category === categorySlug && project.slug === projectSlug)

export const getFeaturedProjects = () =>
  catalogProjects.filter(project => project.featured)
