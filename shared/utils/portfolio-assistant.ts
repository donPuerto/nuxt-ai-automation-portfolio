import { catalogCategories } from '../catalog/categories'
import { getFeaturedProjects } from '../catalog'
import { aboutKnowledge } from '../knowledge/about'
import { portfolioKnowledgeProjects } from '../knowledge/projects'
import { servicesKnowledge } from '../knowledge/services'
import { skillsKnowledge } from '../knowledge/skills'
import { aiPortfolioContent } from '../pages/ai-portfolio'
import type {
  PortfolioAssistantRequest,
  PortfolioAssistantResponse,
  PortfolioAssistantSectionLayout,
} from '../pages/ai-portfolio'

const projectGridLayout: PortfolioAssistantSectionLayout = {
  presentation: 'grid',
  width: 'full',
  align: 'center',
  minCardWidth: 16,
  maxColumns: 4,
}

const listSectionLayout: PortfolioAssistantSectionLayout = {
  presentation: 'list',
  width: 'normal',
  align: 'start',
}

const ctaSectionLayout: PortfolioAssistantSectionLayout = {
  presentation: 'cta',
  width: 'normal',
  align: 'start',
}

const getProjectsSection = (title: string, slugs: string[], layout: PortfolioAssistantSectionLayout = projectGridLayout) => ({
  type: 'projects' as const,
  title,
  projectSlugs: slugs,
  layout,
})

const getHighlightsSection = (title: string, items: readonly string[], layout: PortfolioAssistantSectionLayout = listSectionLayout) => ({
  type: 'highlights' as const,
  title,
  items: [...items],
  layout,
})

const getDiscoveryCta = () => ({
  type: 'cta' as const,
  title: aiPortfolioContent.responseLabels.nextStep,
  action: 'discovery-call' as const,
  label: 'Start AI booking call',
  layout: ctaSectionLayout,
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

const isGreetingPrompt = (prompt: string) => {
  const normalizedPrompt = prompt
    .trim()
    .toLowerCase()
    .replace(/[!?.,]/g, '')

  return [
    'hi',
    'hello',
    'hey',
    'good morning',
    'good afternoon',
    'good evening',
    'yo',
    'hiya',
  ].includes(normalizedPrompt)
}

const isEducationPrompt = (prompt: string) => {
  const normalizedPrompt = prompt.toLowerCase()
  return ['education', 'school', 'college', 'university', 'study', 'studied', 'degree'].some(term => normalizedPrompt.includes(term))
}

const isExperiencePrompt = (prompt: string) => {
  const normalizedPrompt = prompt.toLowerCase()
  return ['experience', 'work experience', 'career', 'resume', 'background', 'job', 'worked'].some(term => normalizedPrompt.includes(term))
}

const isAgePrompt = (prompt: string) => {
  const normalizedPrompt = prompt.toLowerCase()
  return ['age', 'old', 'birthday', 'birth year', 'how old', 'born'].some(term => normalizedPrompt.includes(term))
}

const buildAboutMeResponse = (): PortfolioAssistantResponse => {
  return {
    answer: `${aboutKnowledge.firstPersonIntro} I focus on building automation systems that remove repetitive work, connect the right platforms, and make AI genuinely useful inside real business operations.`,
    sections: [
      getHighlightsSection('About me', aboutKnowledge.resumeHighlights),
      getHighlightsSection('What I do', aboutKnowledge.whatIDo),
      getHighlightsSection('My background', aboutKnowledge.background),
      getHighlightsSection('How I work', aboutKnowledge.workStyle),
      getHighlightsSection('What makes me different', aboutKnowledge.differentiators),
      getHighlightsSection('Tech stack', aboutKnowledge.techStack),
      getHighlightsSection('Availability and contact', [...aboutKnowledge.availability, ...aboutKnowledge.contact]),
    ],
  }
}

export const buildWorkspacePortfolioResponse = (
  request: PortfolioAssistantRequest,
): PortfolioAssistantResponse => {
  const prompt = request.prompt?.trim() ?? ''
  const intent = request.intent ?? 'prompt'

  if (intent === 'settings') {
    return {
      answer: 'Workspace settings are available by section. Open the settings page when you want to change profile, appearance, language, notifications, or knowledge controls.',
      sections: [
        getHighlightsSection('Settings sections', [
          'General: appearance, provider/model preferences, and workspace defaults.',
          'Account: profile details and authentication-related options.',
          'Knowledge Base: source management, indexing health, and document controls.',
        ]),
        getHighlightsSection('Recommended next step', [
          'Use Settings from the left navigation to edit values directly.',
          'After changing model/provider preferences, run a quick prompt test to confirm behavior.',
        ]),
      ],
    }
  }

  if (intent === 'me') {
    return buildAboutMeResponse()
  }

  if (intent === 'discovery-call') {
    return {
      answer: 'The discovery call is an AI booking consultation powered by Retell, designed to quickly scope your workflow and decide the best build path.',
      sections: [
        getHighlightsSection('What happens on the call', [
          'We clarify the workflow, bottlenecks, tools, and business outcome you actually need.',
          'I map where automation, AI, integrations, or a productized workflow can remove manual work fastest.',
          'You leave with a clearer implementation direction, not just a vague conversation.',
        ]),
        getHighlightsSection('Good fit for', [
          'Teams with broken or fragile automations that need to be fixed or rebuilt.',
          'Businesses that want AI integrated into operations without adding unnecessary complexity.',
          'Founders and operators who need a clear scope before committing to a full build.',
        ]),
        getHighlightsSection('After the call', [
          'If the work is straightforward, I can point you toward the right product or next implementation step.',
          'If it needs custom engineering, I can recommend the best build path, scope, and delivery approach.',
        ]),
        getDiscoveryCta(),
      ],
    }
  }

  if (intent === 'skills') {
    return {
      answer: 'My stack is focused on automation platforms and AI routing that can move from quick wins to production workflows.',
      sections: [
        getHighlightsSection('Core stack', skillsKnowledge.coreSkills),
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
      answer: 'Ask me about a workflow, project category, custom service, or my background and I will surface the most relevant work here.',
      sections: [
        getProjectsSection('Featured projects', featuredProjectSlugs),
      ],
    }
  }

  if (isGreetingPrompt(prompt)) {
    return {
      answer: `Hi, I'm Don Puerto. I can help with questions about my background, work experience, education, automation projects, stack, and services.`,
      sections: [],
    }
  }

  if (isEducationPrompt(prompt)) {
    return {
      answer: 'I have a Computer Engineering background, and that foundation helped me move into systems thinking, structured problem-solving, and the kind of automation work I do now.',
      sections: [
        getHighlightsSection('Education', aboutKnowledge.education),
        getHighlightsSection('How it connects to my work', [
          'My technical background helps me design workflows with a stronger systems view, not just quick automations.',
          'I tend to connect operations, integrations, and AI around practical business outcomes instead of treating them as isolated tools.',
        ]),
      ],
    }
  }

  if (isExperiencePrompt(prompt)) {
    return {
      answer: 'My background blends operations leadership with hands-on automation and development work, which is why I approach systems from both the business side and the implementation side.',
      sections: [
        getHighlightsSection('Work experience', aboutKnowledge.workExperience),
        getHighlightsSection('Operational background', aboutKnowledge.background),
        getHighlightsSection('Training and certifications', aboutKnowledge.trainings),
      ],
    }
  }

  if (isAgePrompt(prompt)) {
    return {
      answer: 'I do not have my exact age recorded in the knowledge base, so I cannot answer that precisely. If you want, I can share my education and work history instead.',
      sections: [
        getHighlightsSection('What I can confirm', [
          'Computer Engineering graduate from the University of the Immaculate Conception in Davao City.',
          'Over 10 years of automation and development experience.',
          'Background in operations, production, and inventory-led work before moving into automation.',
        ]),
      ],
    }
  }

  const categoryMatch = findCategoryMatch(prompt)

  if (categoryMatch) {
    const projectSlugs = portfolioKnowledgeProjects
      .filter(project => project.categorySlug === categoryMatch.slug)
      .map(project => project.slug)

    return {
      answer: `I have a set of workflow products in ${categoryMatch.title}. These are the projects I would start with if you want to explore that area.`,
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
    answer: 'Can you clarify what you want to know about me: my background, education, experience, projects, stack, services, or booking workflow?',
    sections: [],
  }
}
