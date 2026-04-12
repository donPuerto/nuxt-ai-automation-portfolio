export type StackCatalogEntry = {
  id: string
  label: string
  category: string
  matcher: string[]
  url: string
  icon: string
  iconClass: string
  details: string[]
  knowledgeLine: string
}

export const stackCatalog = [
  {
    id: 'n8n',
    label: 'n8n',
    category: 'Orchestration',
    matcher: ['n8n'],
    url: 'https://n8n.io/',
    icon: 'simple-icons:n8n',
    iconClass: 'text-[#f06a1f]',
    details: [
      'Production-grade workflow orchestration with webhook-first architecture.',
      'Best fit for multi-step business processes, queueing, routing, and AI tool chains.',
    ],
    knowledgeLine: 'n8n workflow orchestration and advanced automation flows',
  },
  {
    id: 'make',
    label: 'Make',
    category: 'Scenario design',
    matcher: ['make.com', 'make'],
    url: 'https://www.make.com/',
    icon: 'simple-icons:make',
    iconClass: 'text-[#6d5efc]',
    details: [
      'Fast scenario prototyping for operations teams and cross-app workflows.',
      'Useful when a flow needs to be flexible and visual before it becomes a hardened system.',
    ],
    knowledgeLine: 'Make.com scenario design for multi-step business processes',
  },
  {
    id: 'zapier',
    label: 'Zapier',
    category: 'Integrations',
    matcher: ['zapier'],
    url: 'https://zapier.com/',
    icon: 'simple-icons:zapier',
    iconClass: 'text-[#ff5a1f]',
    details: [
      'Quick app-to-app glue for lightweight automations and fast launches.',
      'Great when the goal is speed and maintainability over deep orchestration.',
    ],
    knowledgeLine: 'Zapier integrations for fast no-code app connections',
  },
  {
    id: 'ghl',
    label: 'GoHighLevel',
    category: 'CRM automation',
    matcher: ['gohighlevel', 'highlevel'],
    url: 'https://www.gohighlevel.com/',
    icon: 'lucide:badge-dollar-sign',
    iconClass: 'text-[#4ecdc4]',
    details: [
      'Pipeline automation, follow-up sequences, and booking-driven CRM flows.',
      'Useful for lead reactivation, nurture systems, and sales operations handoff.',
    ],
    knowledgeLine: 'GoHighLevel CRM automation, pipelines, and follow-up sequences',
  },
  {
    id: 'slack',
    label: 'Slack',
    category: 'Team alerts',
    matcher: ['slack'],
    url: 'https://slack.com/',
    icon: 'simple-icons:slack',
    iconClass: 'text-[#4a154b]',
    details: [
      'Operational notifications, approvals, and internal workflow handoffs inside team channels.',
      'Useful when automations need human visibility without leaving the messaging layer.',
    ],
    knowledgeLine: 'Slack connected into automation alerts, approvals, and internal team operations',
  },
  {
    id: 'discord',
    label: 'Discord',
    category: 'Community ops',
    matcher: ['discord'],
    url: 'https://discord.com/',
    icon: 'simple-icons:discord',
    iconClass: 'text-[#5865f2]',
    details: [
      'Bot-driven workflows, community triggers, and real-time update delivery inside Discord spaces.',
      'Useful for product communities, support rooms, and lightweight event automation.',
    ],
    knowledgeLine: 'Discord connected into community workflows, bot triggers, and support operations',
  },
  {
    id: 'claude',
    label: 'Claude',
    category: 'AI agents',
    matcher: ['claude'],
    url: 'https://www.anthropic.com/claude',
    icon: 'simple-icons:anthropic',
    iconClass: 'text-[#d97757]',
    details: [
      'Reasoning layer for internal copilots, SOP assistants, and structured AI replies.',
      'Strong fit for calm, instruction-heavy AI experiences that need reliable tone and tool use.',
    ],
    knowledgeLine: 'AI agent pipelines across Claude, OpenRouter, and OpenAI',
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    category: 'Model routing',
    matcher: ['openrouter'],
    url: 'https://openrouter.ai/',
    icon: 'lucide:orbit',
    iconClass: 'text-[#8ba4ff]',
    details: [
      'Model routing layer for switching between providers without rewriting the app.',
      'Useful for balancing speed, cost, and availability across multiple AI backends.',
    ],
    knowledgeLine: 'AI agent pipelines across Claude, OpenRouter, and OpenAI',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    category: 'Reasoning layer',
    matcher: ['openai'],
    url: 'https://openai.com/',
    icon: 'simple-icons:openai',
    iconClass: 'text-[#f4f4f2]',
    details: [
      'General-purpose reasoning and generation for AI product flows and assistants.',
      'Useful when a workflow needs flexible output shaping, summarization, or tool orchestration.',
    ],
    knowledgeLine: 'AI agent pipelines across Claude, OpenRouter, and OpenAI',
  },
  {
    id: 'webhooks',
    label: 'Webhooks',
    category: 'API bridges',
    matcher: ['webhook', 'api'],
    url: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API',
    icon: 'lucide:webhook',
    iconClass: 'text-[#e0b36a]',
    details: [
      'Bridges apps, APIs, and automation platforms with explicit request-response contracts.',
      'The backbone for syncing systems cleanly without fragile manual handoffs.',
    ],
    knowledgeLine: 'Webhook-first architecture and API-to-automation bridging',
  },
  {
    id: 'deepgram',
    label: 'Deepgram',
    category: 'Speech to text',
    matcher: ['deepgram'],
    url: 'https://deepgram.com/',
    icon: 'lucide:audio-lines',
    iconClass: 'text-[#5eead4]',
    details: [
      'Streaming and batch transcription for voice-first workflows and call analysis.',
      'Useful when automation needs accurate speech capture before classification or routing.',
    ],
    knowledgeLine: 'Deepgram for speech-to-text and transcription workflows',
  },
  {
    id: 'assemblyai',
    label: 'Assembly AI',
    category: 'Transcription',
    matcher: ['assemblyai', 'assembly ai'],
    url: 'https://www.assemblyai.com/',
    icon: 'lucide:waveform',
    iconClass: 'text-[#f59e0b]',
    details: [
      'Speech-to-text pipelines for uploaded media, call recordings, and voice notes.',
      'Useful for turning raw audio into searchable text that can flow into RAG and automation.',
    ],
    knowledgeLine: 'Assembly AI for speech-to-text and transcription workflows',
  },
  {
    id: 'whisper',
    label: 'Whisper',
    category: 'Audio models',
    matcher: ['whisper'],
    url: 'https://openai.com/research/whisper',
    icon: 'lucide:audio-waveform',
    iconClass: 'text-[#c4b5fd]',
    details: [
      'Model-based transcription for voice workflows where flexible deployment matters.',
      'Useful for speech pipelines that need direct model-level control instead of a single SaaS layer.',
    ],
    knowledgeLine: 'Whisper for model-level speech-to-text and transcription workflows',
  },
  {
    id: 'retell',
    label: 'Retell',
    category: 'Voice agents',
    matcher: ['retell'],
    url: 'https://www.retellai.com/',
    icon: 'lucide:phone-call',
    iconClass: 'text-[#fb7185]',
    details: [
      'Voice-agent runtime for consultation calls, phone workflows, and AI booking flows.',
      'Useful when spoken interaction is part of the product, not just text chat.',
    ],
    knowledgeLine: 'Retell for voice agents and AI booking call experiences',
  },
  {
    id: 'elevenlabs',
    label: 'Eleven Labs',
    category: 'Voice synthesis',
    matcher: ['elevenlabs', 'eleven labs'],
    url: 'https://elevenlabs.io/',
    icon: 'lucide:mic-vocal',
    iconClass: 'text-[#60a5fa]',
    details: [
      'Voice generation and conversational audio output for agents, demos, and branded voice UX.',
      'Useful when the assistant needs natural speech output rather than text alone.',
    ],
    knowledgeLine: 'Eleven Labs for voice generation, spoken assistant UX, and AI call output',
  },
] as const satisfies readonly StackCatalogEntry[]

export const stackKnowledgeLines = [...new Set(stackCatalog.map(item => item.knowledgeLine))]
