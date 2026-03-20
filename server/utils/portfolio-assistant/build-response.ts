import {
  aboutKnowledge,
  aiPortfolioContent,
  catalogCategories,
  getFeaturedProjects,
  portfolioKnowledgeProjects,
  servicesKnowledge,
  skillsKnowledge,
} from '@@/shared'
import type {
  PortfolioAssistantRequest,
  PortfolioAssistantResponse,
} from './types'

const getProjectsSection = (title: string, slugs: string[]) => ({
  type: 'projects' as const,
  title,
  projectSlugs: slugs,
})

const getHighlightsSection = (title: string, items: readonly string[]) => ({
  type: 'highlights' as const,
  title,
  items: [...items],
})

const getDiscoveryCta = () => ({
  type: 'cta' as const,
  title: aiPortfolioContent.responseLabels.nextStep,
  action: 'discovery-call' as const,
  label: 'Start a discovery call',
})

const featuredProjectSlugs = getFeaturedProjects().map(project => project.slug)

const findCategoryMatch = (prompt: string) => {
  const normalizedPrompt = prompt.toLowerCase()

  return catalogCategories.find((category) => {
    const terms = [
      category.slug,
      category.title,
      category.shortTitle,
    ]

    return terms.some(term => normalizedPrompt.includes(term.toLowerCase()))
  })
}

const findProjectMatches = (prompt: string) => {
  const normalizedPrompt = prompt.toLowerCase()

  return portfolioKnowledgeProjects
    .filter(project =>
      normalizedPrompt.includes(project.title.toLowerCase())
      || normalizedPrompt.includes(project.slug.toLowerCase())
      || normalizedPrompt.includes(project.categoryLabel.toLowerCase()),
    )
    .map(project => project.slug)
}

export const buildPortfolioAssistantResponse = (
  request: PortfolioAssistantRequest,
): PortfolioAssistantResponse => {
  const prompt = request.prompt?.trim() ?? ''
  const intent = request.intent ?? 'prompt'

  if (intent === 'me') {
    return {
      answer: `${aboutKnowledge.firstPersonIntro} I'm based in ${aboutKnowledge.location}, and I like making the portfolio itself feel like a product experience instead of a static résumé page.`,
      sections: [
        getHighlightsSection('About me', aboutKnowledge.resumeHighlights),
        getDiscoveryCta(),
      ],
    }
  }

  if (intent === 'skills') {
    return {
      answer: 'My strongest work sits at the intersection of workflow design, AI-assisted systems, and productized delivery. I like building things people can either buy instantly or adapt into custom solutions.',
      sections: [
        getHighlightsSection('Core skills', skillsKnowledge.coreSkills),
        getDiscoveryCta(),
      ],
    }
  }

  if (intent === 'projects') {
    return {
      answer: 'These are the projects I usually surface first when someone wants to understand the kind of workflow products and custom solutions I build.',
      sections: [
        getProjectsSection('Featured projects', featuredProjectSlugs),
        getDiscoveryCta(),
      ],
    }
  }

  if (intent === 'category' && request.categoryId) {
    const category = catalogCategories.find(item => item.slug === request.categoryId)
    const projectSlugs = portfolioKnowledgeProjects
      .filter(project => project.categorySlug === request.categoryId)
      .map(project => project.slug)

    if (category && projectSlugs.length) {
      return {
        answer: `${category.title} is one of the workflow areas I package most clearly. Here are the projects I currently surface in that category.`,
        sections: [
          getProjectsSection(category.title, projectSlugs),
          getDiscoveryCta(),
        ],
      }
    }
  }

  if (!prompt) {
    return {
      answer: 'Ask me about a workflow, project category, custom service, or my background and I’ll surface the most relevant work here.',
      sections: [
        getProjectsSection('Featured projects', featuredProjectSlugs),
      ],
    }
  }

  const categoryMatch = findCategoryMatch(prompt)

  if (categoryMatch) {
    const projectSlugs = portfolioKnowledgeProjects
      .filter(project => project.categorySlug === categoryMatch.slug)
      .map(project => project.slug)

    return {
      answer: `I have a set of workflow products in ${categoryMatch.title}. These are the projects I’d start with if you want to explore that area.`,
      sections: [
        getProjectsSection(categoryMatch.title, projectSlugs),
        getDiscoveryCta(),
      ],
    }
  }

  if (prompt.toLowerCase().includes('service') || prompt.toLowerCase().includes('custom')) {
    return {
      answer: 'I split my offer into two paths: workflow products you can access quickly, and custom builds when the system needs to be shaped around a specific process or client delivery flow.',
      sections: [
        getHighlightsSection('Services', servicesKnowledge.positioning),
        getProjectsSection('Projects to start with', featuredProjectSlugs.slice(0, 4)),
        getDiscoveryCta(),
      ],
    }
  }

  const directProjectMatches = findProjectMatches(prompt)

  if (directProjectMatches.length) {
    return {
      answer: 'I found project matches tied closely to what you asked. Here they are in the same canvas so you can drill into them without leaving the page.',
      sections: [
        getProjectsSection('Matching projects', directProjectMatches),
      ],
    }
  }

  return {
    answer: 'The closest way I can answer that right now is by showing the workflow products and custom-build direction I think best match what you asked.',
    sections: [
      getProjectsSection('Relevant projects', featuredProjectSlugs.slice(0, 6)),
      getDiscoveryCta(),
    ],
  }
}
