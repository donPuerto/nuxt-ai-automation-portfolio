export type AiPortfolioNavIntent =
  | 'me'
  | 'projects'
  | 'skills'
  | 'discovery-call'

export interface AiPortfolioPromptSuggestion {
  id: string
  text: string
}

export interface AiPortfolioDescriptorLine {
  id: string
  text: string
}

export type AiPortfolioPromptMenuItemType = 'item' | 'separator' | 'submenu'

export interface AiPortfolioPromptMenuItem {
  id: string
  label: string
  type?: AiPortfolioPromptMenuItemType
  icon?: string
  checked?: boolean
  disabled?: boolean
  badge?: string
  children?: AiPortfolioPromptMenuItem[]
}

export interface AiPortfolioPromptAgentOption {
  id: string
  label: string
  description: string
  available: boolean
}

export type AiPortfolioGreetingAnimation =
  | 'stagger-chars'
  | 'fade-up'
  | 'blur-rise'

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
  descriptorLines: [
    {
      id: 'descriptor-primary',
      text: 'Workflow Builder and Automation Specialist',
    },
    {
      id: 'descriptor-projects',
      text: 'Projects, workflows, and custom automation solutions.',
    },
    {
      id: 'descriptor-access',
      text: 'Instant-access systems and tailored implementation builds.',
    },
    {
      id: 'descriptor-ai',
      text: 'AI-powered workflow products, demos, and custom services.',
    },
    {
      id: 'descriptor-experience',
      text: 'Automation experience across delivery, systems, and support.',
    },
  ] satisfies AiPortfolioDescriptorLine[],
  greetingAnimation: 'blur-rise' as AiPortfolioGreetingAnimation,
  promptPlaceholder: 'Ask about my projects, workflows, or services...',
  promptAgentLabel: 'Local portfolio agent',
  promptAgentDescription: 'Don Puerto knowledge base',
  selectedPromptAgentId: 'local-portfolio-agent',
  promptAgentOptions: [
    {
      id: 'local-portfolio-agent',
      label: 'Local portfolio agent',
      description: 'Current knowledge source for this AI portfolio.',
      available: true,
    },
    {
      id: 'claude-sonnet',
      label: 'Claude Sonnet',
      description: 'Coming soon once Anthropic is wired into the portfolio.',
      available: false,
    },
    {
      id: 'claude-opus',
      label: 'Claude Opus 4.5',
      description: 'Coming soon once live Claude models are enabled.',
      available: false,
    },
    {
      id: 'custom-agent',
      label: 'Custom knowledge agent',
      description: 'Reserved for future persona and connector routing.',
      available: false,
    },
  ] satisfies AiPortfolioPromptAgentOption[],
  promptToolMenu: [
    {
      id: 'add-files',
      label: 'Add files or photos',
      icon: 'lucide:paperclip',
    },
    {
      id: 'take-screenshot',
      label: 'Take a screenshot',
      icon: 'lucide:camera',
    },
    {
      id: 'add-to-project',
      label: 'Add to project',
      icon: 'lucide:folder-plus',
      type: 'submenu',
      children: [
        {
          id: 'project-current',
          label: 'Current portfolio project',
        },
        {
          id: 'project-new',
          label: 'New portfolio collection',
          badge: 'Soon',
          disabled: true,
        },
      ],
    },
    {
      id: 'add-from-drive',
      label: 'Add from Google Drive',
      icon: 'logos:google-drive',
      type: 'submenu',
      children: [
        {
          id: 'drive-resume',
          label: 'Resume folder',
          badge: 'Soon',
          disabled: true,
        },
        {
          id: 'drive-projects',
          label: 'Project docs',
          badge: 'Soon',
          disabled: true,
        },
      ],
    },
    {
      id: 'add-from-github',
      label: 'Add from GitHub',
      icon: 'logos:github-icon',
      badge: 'Soon',
      disabled: true,
    },
    {
      id: 'separator-library',
      label: '',
      type: 'separator',
    },
    {
      id: 'skills',
      label: 'Skills',
      icon: 'lucide:graduation-cap',
      type: 'submenu',
      children: [
        {
          id: 'skills-automation',
          label: 'Automation systems',
        },
        {
          id: 'skills-ai',
          label: 'AI workflows',
        },
      ],
    },
    {
      id: 'connectors',
      label: 'Connectors',
      icon: 'lucide:plug-zap',
      type: 'submenu',
      children: [
        {
          id: 'connector-drive',
          label: 'Google Drive',
          badge: 'Soon',
          disabled: true,
        },
        {
          id: 'connector-github',
          label: 'GitHub',
          badge: 'Soon',
          disabled: true,
        },
      ],
    },
    {
      id: 'separator-research',
      label: '',
      type: 'separator',
    },
    {
      id: 'research',
      label: 'Research',
      icon: 'lucide:search-code',
    },
    {
      id: 'web-search',
      label: 'Web search',
      icon: 'lucide:globe',
      checked: true,
    },
    {
      id: 'use-style',
      label: 'Use style',
      icon: 'lucide:paintbrush',
      type: 'submenu',
      children: [
        {
          id: 'style-claude',
          label: 'Claude-inspired',
        },
        {
          id: 'style-minimal',
          label: 'Minimal dark',
        },
      ],
    },
  ] satisfies AiPortfolioPromptMenuItem[],
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
