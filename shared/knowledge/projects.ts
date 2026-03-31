import { catalogProjects, getCategoryBySlug } from '../catalog'

export interface PortfolioKnowledgeProject {
  slug: string
  categorySlug: string
  categoryLabel: string
  title: string
  summary: string
  thumbnail: string
  youtubeUrl?: string
  priceLabel: string
  instantAccessUrl: string
  customBuildAvailable: boolean
  workflowOverview: string[]
  valueBullets: string[]
  interactiveTool?: {
    type: 'video-to-text-transcriber'
  }
}

export const portfolioKnowledgeProjects: PortfolioKnowledgeProject[] = catalogProjects.map((project) => {
  const category = getCategoryBySlug(project.category)

  return {
    slug: project.slug,
    categorySlug: project.category,
    categoryLabel: category?.title ?? project.category,
    title: project.title,
    summary: project.summary,
    thumbnail: project.thumbnail,
    youtubeUrl: project.youtubeUrl,
    priceLabel: project.priceLabel,
    instantAccessUrl: `/projects/${project.category}/${project.slug}/access`,
    customBuildAvailable: true,
    workflowOverview: project.workflowOverview,
    valueBullets: project.deliverables.slice(0, 3),
    interactiveTool: project.interactiveTool,
  }
})
