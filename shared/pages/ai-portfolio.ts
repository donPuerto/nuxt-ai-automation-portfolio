export type AiPortfolioNavIntent =
  | 'me'
  | 'projects'
  | 'skills'
  | 'fun'
  | 'discovery-call'

export interface AiPortfolioPromptSuggestion {
  id: string
  text: string
}

export interface AiPortfolioMarqueeItem {
  id: string
  label: string
  description: string
  prompt: string
}

export interface AiPortfolioNavItem {
  id: AiPortfolioNavIntent
  label: string
  icon: string
  prompt?: string
}

export type PortfolioAssistantIntent =
  | 'prompt'
  | 'me'
  | 'projects'
  | 'skills'
  | 'fun'
  | 'category'

export interface PortfolioAssistantRequest {
  prompt?: string
  intent?: PortfolioAssistantIntent
  categoryId?: string
}

export interface PortfolioAssistantHighlightsSection {
  type: 'highlights'
  title: string
  items: string[]
}

export interface PortfolioAssistantProjectsSection {
  type: 'projects'
  title: string
  projectSlugs: string[]
}

export interface PortfolioAssistantCtaSection {
  type: 'cta'
  title: string
  action: 'discovery-call'
  label: string
}

export type PortfolioAssistantSection =
  | PortfolioAssistantHighlightsSection
  | PortfolioAssistantProjectsSection
  | PortfolioAssistantCtaSection

export interface PortfolioAssistantResponse {
  answer: string
  sections: PortfolioAssistantSection[]
}

export const aiPortfolioContent = {
  nameLine: `Hey, I'm Don Puerto`,
  descriptor: 'Workflow Builder and Automation Specialist',
  promptPlaceholder: 'Ask about my projects, workflows, or services...',
  promptSuggestions: [
    {
      id: 'projects',
      text: 'Ask about my projects, workflows, or services...',
    },
    {
      id: 'instant-access',
      text: 'Show me the workflows available for instant access...',
    },
    {
      id: 'custom-builds',
      text: 'What custom solutions can you build?...',
    },
    {
      id: 'experience',
      text: 'Tell me about your automation experience...',
    },
  ] satisfies AiPortfolioPromptSuggestion[],
  marqueeItems: [
    {
      id: 'content-social-media',
      label: 'Content Creation & Social Media',
      description: 'Publishing-ready workflows for content systems.',
      prompt: 'Show me your Content Creation & Social Media workflow projects.',
    },
    {
      id: 'sales-lead-generation',
      label: 'Sales & Lead Generation',
      description: 'Lead capture, outreach, and follow-up automations.',
      prompt: 'Show me your Sales & Lead Generation workflow projects.',
    },
    {
      id: 'appointments-customer-support',
      label: 'Appointments & Customer Support',
      description: 'Booking, routing, reminders, and support workflow builds.',
      prompt: 'Show me your Appointments & Customer Support projects.',
    },
    {
      id: 'productivity-admin',
      label: 'Productivity & Admin',
      description: 'Internal approvals, handoffs, and reporting automations.',
      prompt: 'Show me your Productivity & Admin workflow projects.',
    },
    {
      id: 'ai-agents-internal-tools',
      label: 'AI Agents & Internal Tools',
      description: 'AI copilots, agents, and internal tools.',
      prompt: 'Show me your AI Agents & Internal Tools projects.',
    },
    {
      id: 'crm-follow-up-automation',
      label: 'CRM & Follow-up Automation',
      description: 'CRM automations that keep follow-up moving.',
      prompt: 'Show me your CRM & Follow-up Automation projects.',
    },
  ] satisfies AiPortfolioMarqueeItem[],
  navItems: [
    {
      id: 'me',
      label: 'Me',
      icon: 'lucide:user-round',
      prompt: 'Tell me about yourself, your background, and what you build.',
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: 'lucide:briefcase-business',
      prompt: 'Show me your featured workflow projects.',
    },
    {
      id: 'skills',
      label: 'Skills',
      icon: 'lucide:layers-3',
      prompt: 'What skills and tools do you work with most?',
    },
    {
      id: 'fun',
      label: 'Fun',
      icon: 'lucide:sparkles',
      prompt: 'Tell me something fun or personal about how you work.',
    },
    {
      id: 'discovery-call',
      label: 'Discovery Call',
      icon: 'lucide:phone-call',
    },
  ] satisfies AiPortfolioNavItem[],
  responseLabels: {
    answer: 'Answer',
    projects: 'Relevant Projects',
    offers: 'What I Offer',
    nextStep: 'Next Step',
  },
} as const
