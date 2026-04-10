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
  costLabel?: string
  inputPriceUsdPerMillion?: number
  outputPriceUsdPerMillion?: number
  releaseDate?: string
  isObsolete?: boolean
  requiresAuth?: boolean
  available: boolean
  provider?: 'openrouter' | 'claude' | 'openai'
}

export type AiPortfolioGreetingAnimation =
  | 'stagger-chars'
  | 'fade-up'
  | 'blur-rise'

export interface AiPortfolioNavItem {
  id: AiPortfolioNavIntent
  label: string
  icon: string
  prompt?: string
}

export interface AiPortfolioSidebarNavItem {
  id: AiPortfolioNavIntent
  label: string
  icon: string
}

export interface AiPortfolioSidebarSeed {
  id: string
  label: string
  icon: string
  intent?: PortfolioAssistantIntent
  prompt?: string
}

export type AiPortfolioSidebarProfileMenuItemType = 'item' | 'separator'

export interface AiPortfolioSidebarProfileMenuItem {
  id: string
  label: string
  icon?: string
  type?: AiPortfolioSidebarProfileMenuItemType
}

export type PortfolioAssistantIntent =
  | 'prompt'
  | 'me'
  | 'projects'
  | 'skills'
  | 'discovery-call'
  | 'category'

export interface PortfolioAssistantAttachment {
  id: string
  name: string
  mimeType: string
  size: number
}

export interface PortfolioAssistantRequest {
  prompt?: string
  intent?: PortfolioAssistantIntent
  categoryId?: string
  attachments?: PortfolioAssistantAttachment[]
  agentId?: string
}

export interface PortfolioAssistantHighlightsSection {
  type: 'highlights'
  title: string
  items: string[]
  layout?: PortfolioAssistantSectionLayout
}

export interface PortfolioAssistantProjectsSection {
  type: 'projects'
  title: string
  projectSlugs: string[]
  layout?: PortfolioAssistantSectionLayout
}

export interface PortfolioAssistantCtaSection {
  type: 'cta'
  title: string
  action: 'discovery-call'
  label: string
  layout?: PortfolioAssistantSectionLayout
}

export type PortfolioAssistantSectionPresentation =
  | 'list'
  | 'grid'
  | 'cta'

export type PortfolioAssistantSectionWidth =
  | 'normal'
  | 'wide'
  | 'full'

export type PortfolioAssistantSectionAlign =
  | 'start'
  | 'center'

export interface PortfolioAssistantSectionLayout {
  presentation?: PortfolioAssistantSectionPresentation
  width?: PortfolioAssistantSectionWidth
  align?: PortfolioAssistantSectionAlign
  minCardWidth?: number
  maxColumns?: number
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
  promptAgentLabel: 'OpenRouter (Free)',
  promptAgentDescription: 'Use OpenRouter free model by default.',
  selectedPromptAgentId: 'openrouter-free',
  promptAgentOptions: [
    {
      id: 'openrouter-free',
      label: 'OpenRouter (Free models)',
      description: 'Default provider using free-tier routing on OpenRouter.',
      costLabel: 'Free',
      requiresAuth: false,
      available: true,
      provider: 'openrouter',
    },
    {
      id: 'claude-sonnet-4-5',
      label: 'Claude Sonnet 4.5',
      description: 'Route prompts to Anthropic Claude Sonnet 4.5 via your workflow.',
      costLabel: '$3.00 / $15.00 per 1M',
      inputPriceUsdPerMillion: 3,
      outputPriceUsdPerMillion: 15,
      requiresAuth: true,
      available: true,
      provider: 'claude',
    },
    {
      id: 'openai-gpt-4-1-mini',
      label: 'OpenAI GPT-4.1 mini',
      description: 'Route prompts to OpenAI GPT-4.1 mini via your workflow.',
      costLabel: '$0.40 / $1.60 per 1M',
      inputPriceUsdPerMillion: 0.4,
      outputPriceUsdPerMillion: 1.6,
      requiresAuth: true,
      available: true,
      provider: 'openai',
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
      label: 'Stack',
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
      label: 'Stack',
      icon: 'lucide:layers-3',
      prompt: 'What stack and tools do you use most?',
    },
    {
      id: 'discovery-call',
      label: 'AI booking',
      icon: 'lucide:calendar-clock',
      prompt: 'Book an AI consultation call powered by Retell.',
    },
  ] satisfies AiPortfolioNavItem[],
  sidebarNavigationLabel: 'Navigation',
  sidebarNavItems: [
    {
      id: 'me',
      label: 'Me',
      icon: 'lucide:user-round',
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: 'lucide:briefcase-business',
    },
    {
      id: 'discovery-call',
      label: 'AI booking',
      icon: 'lucide:calendar-clock',
    },
  ] satisfies AiPortfolioSidebarNavItem[],
  sidebarTitle: 'Claude workspace',
  sidebarDescription: 'Portfolio chat',
  sidebarNewChatLabel: 'New chat',
  sidebarHistoryLabel: 'Recent prompts',
  sidebarEmptyLabel: 'Your recent prompts will appear here.',
  sidebarProfileName: 'Don Puerto',
  sidebarProfileEmail: 'm@example.com',
  sidebarProfilePlan: 'Pro plan',
  sidebarProfileActionLabel: 'Download résumé',
  sidebarProfileMenuLabel: 'Open profile actions',
  sidebarProfileMenuItems: [
    {
      id: 'settings',
      label: 'Settings',
      icon: 'lucide:settings',
    },
    {
      id: 'language',
      label: 'Language (English)',
      icon: 'lucide:languages',
    },
    {
      id: 'get-help',
      label: 'Get Help',
      icon: 'lucide:circle-help',
    },
    {
      id: 'separator-apps',
      label: '',
      type: 'separator',
    },
    {
      id: 'extensions',
      label: 'Extensions',
      icon: 'lucide:puzzle',
    },
    {
      id: 'roadmap',
      label: 'Roadmap',
      icon: 'lucide:map',
    },
    {
      id: 'whats-new',
      label: "What's New",
      icon: 'lucide:sparkles',
    },
    {
      id: 'separator-logout',
      label: '',
      type: 'separator',
    },
    {
      id: 'logout',
      label: 'Logout',
      icon: 'lucide:log-out',
    },
  ] satisfies AiPortfolioSidebarProfileMenuItem[],
  sidebarSeedItems: [
    {
      id: 'seed-projects',
      label: 'Featured workflows',
      icon: 'lucide:briefcase-business',
      intent: 'projects',
      prompt: 'Show me your featured workflow projects.',
    },
    {
      id: 'seed-skills',
      label: 'Automation stack',
      icon: 'lucide:layers-3',
      intent: 'skills',
      prompt: 'What stack and tools do you use most?',
    },
    {
      id: 'seed-about',
      label: 'About Don Puerto',
      icon: 'lucide:user-round',
      intent: 'me',
      prompt: 'Tell me about yourself, your background, and what you build.',
    },
  ] satisfies AiPortfolioSidebarSeed[],
  responseLabels: {
    answer: 'Answer',
    projects: 'Relevant Projects',
    offers: 'What I Offer',
    nextStep: 'Next Step',
  },
} as const
