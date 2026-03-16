export interface CatalogCategory {
  slug: string
  title: string
  shortTitle: string
  description: string
  icon: string
  accentFrom: string
  accentTo: string
}

export interface CatalogProject {
  slug: string
  title: string
  category: CatalogCategory['slug']
  summary: string
  businessOutcome: string
  platforms: string[]
  thumbnail: string
  youtubeUrl: string
  priceLabel: string
  paymentLink: string
  problem: string
  solution: string
  workflowOverview: string[]
  deliverables: string[]
  resultsOrExpectedOutcome: string[]
  visibility: 'public' | 'anonymized'
  anonymized: boolean
  audience: string
  featured?: boolean
}

export const catalogCategories: CatalogCategory[] = [
  {
    slug: 'content-social-media',
    title: 'Content Creation & Social Media',
    shortTitle: 'Content',
    description: 'Automations that turn rough ideas, recordings, and source material into publish-ready assets.',
    icon: 'lucide:clapperboard',
    accentFrom: 'from-cyan-500/20',
    accentTo: 'to-sky-500/10'
  },
  {
    slug: 'sales-lead-generation',
    title: 'Sales & Lead Generation',
    shortTitle: 'Sales',
    description: 'Outbound, lead capture, enrichment, and follow-up systems that keep pipeline moving.',
    icon: 'lucide:badge-dollar-sign',
    accentFrom: 'from-emerald-500/20',
    accentTo: 'to-lime-500/10'
  },
  {
    slug: 'appointments-customer-support',
    title: 'Appointments & Customer Support',
    shortTitle: 'Support',
    description: 'Booking, routing, reminders, and support handoff workflows built for response speed.',
    icon: 'lucide:phone-call',
    accentFrom: 'from-orange-500/20',
    accentTo: 'to-amber-500/10'
  },
  {
    slug: 'productivity-admin',
    title: 'Productivity & Admin',
    shortTitle: 'Ops',
    description: 'Internal automations for back-office operations, approvals, handoffs, and reporting.',
    icon: 'lucide:bolt',
    accentFrom: 'from-violet-500/20',
    accentTo: 'to-fuchsia-500/10'
  },
  {
    slug: 'ai-agents-internal-tools',
    title: 'AI Agents & Internal Tools',
    shortTitle: 'AI Agents',
    description: 'Claude-powered systems and internal copilots that make teams faster without adding headcount.',
    icon: 'lucide:bot',
    accentFrom: 'from-indigo-500/20',
    accentTo: 'to-blue-500/10'
  },
  {
    slug: 'crm-follow-up-automation',
    title: 'CRM & Follow-up Automation',
    shortTitle: 'CRM',
    description: 'GoHighLevel and CRM-centered workflows that keep leads warm and delivery organized.',
    icon: 'lucide:workflow',
    accentFrom: 'from-rose-500/20',
    accentTo: 'to-pink-500/10'
  }
]

export const catalogProjects: CatalogProject[] = [
  {
    slug: 'podcast-publisher-engine',
    title: 'Podcast Publisher Engine',
    category: 'content-social-media',
    summary: 'Turns a topic prompt or voice note into a recorded, packaged, and distributed podcast episode.',
    businessOutcome: 'Launch episodes faster without touching editing, upload, or distribution by hand.',
    platforms: ['n8n', 'Claude worker', 'Make'],
    thumbnail: 'Prompt in. Episode out. Published everywhere.',
    youtubeUrl: 'https://www.youtube.com/watch?v=ysz5S6PUM-U',
    priceLabel: '$149 template',
    paymentLink: 'https://buy.stripe.com/test_00g000000000000000',
    problem: 'Publishing a single episode usually means bouncing between scripting, voice, graphics, metadata, and podcast hosts.',
    solution: 'This system coordinates ideation, script creation, voice production, artwork packaging, and publishing so one input becomes a release-ready episode.',
    workflowOverview: [
      'Captures a topic or voice prompt and generates the episode brief',
      'Creates narration script and asset checklist through Claude',
      'Packages distribution assets and posts to the publishing stack'
    ],
    deliverables: ['n8n workflow', 'prompt pack', 'setup guide', 'handoff checklist'],
    resultsOrExpectedOutcome: ['Cuts production time per episode', 'Standardizes output quality', 'Removes repetitive publishing steps'],
    visibility: 'public',
    anonymized: false,
    audience: 'Coaches, creators, and service brands',
    featured: true
  },
  {
    slug: 'social-repurposing-factory',
    title: 'Social Repurposing Factory',
    category: 'content-social-media',
    summary: 'Breaks long-form content into channel-ready posts, hooks, carousels, and caption variants.',
    businessOutcome: 'Stretch one source asset into a full week of platform-specific content.',
    platforms: ['Claude worker', 'Make', 'Zapier'],
    thumbnail: 'One source video becomes multiple publish-ready assets.',
    youtubeUrl: 'https://www.youtube.com/watch?v=ysz5S6PUM-U',
    priceLabel: '$119 template',
    paymentLink: 'https://buy.stripe.com/test_00g000000000000000',
    problem: 'Most teams get stuck repackaging one good idea across every platform.',
    solution: 'The workflow analyzes a source asset, extracts hooks, and formats content packages for each target channel.',
    workflowOverview: [
      'Ingests source content from a drive folder or upload trigger',
      'Generates platform-specific copy packs and content angles',
      'Pushes final assets to approval-ready destinations'
    ],
    deliverables: ['automation workflow', 'caption templates', 'approval board mapping'],
    resultsOrExpectedOutcome: ['More output from existing content', 'Less context switching', 'Consistent messaging across platforms'],
    visibility: 'public',
    anonymized: false,
    audience: 'Personal brands, agencies, and social teams'
  },
  {
    slug: 'linkedin-outreach-orchestrator',
    title: 'LinkedIn Outreach Orchestrator',
    category: 'sales-lead-generation',
    summary: 'Finds prospects, enriches context, drafts personalized outreach, and routes replies into the sales pipeline.',
    businessOutcome: 'Generate qualified conversations without spending hours on manual prospecting.',
    platforms: ['n8n', 'Zapier', 'Claude worker'],
    thumbnail: 'Prospects in, context enriched, outreach queued.',
    youtubeUrl: 'https://www.youtube.com/watch?v=ysz5S6PUM-U',
    priceLabel: '$199 system',
    paymentLink: 'https://buy.stripe.com/test_00g000000000000000',
    problem: 'Outbound usually breaks when sourcing, personalization, and reply tracking all live in different tools.',
    solution: 'This orchestration flow enriches profiles, scores them, drafts personalized messaging, and keeps your follow-up list clean.',
    workflowOverview: [
      'Collects target profiles from forms, sheets, or scraping sources',
      'Enriches role, company, and offer relevance before drafting outreach',
      'Routes positive replies into CRM and follow-up sequences'
    ],
    deliverables: ['workflow system', 'outreach prompt logic', 'CRM mapping sheet'],
    resultsOrExpectedOutcome: ['Higher personalization quality', 'Faster campaign launch', 'Cleaner lead handoff'],
    visibility: 'public',
    anonymized: false,
    audience: 'Lead gen teams, appointment setters, founders',
    featured: true
  },
  {
    slug: 'lead-intake-qualification-router',
    title: 'Lead Intake & Qualification Router',
    category: 'sales-lead-generation',
    summary: 'Scores inbound leads, tags buyer intent, and routes each contact to the right next step automatically.',
    businessOutcome: 'Stop treating every inbound inquiry the same and respond with the right motion immediately.',
    platforms: ['Make', 'GHL', 'Claude worker'],
    thumbnail: 'Inbound forms become prioritized sales actions.',
    youtubeUrl: 'https://www.youtube.com/watch?v=ysz5S6PUM-U',
    priceLabel: '$129 template',
    paymentLink: 'https://buy.stripe.com/test_00g000000000000000',
    problem: 'Inbound leads slow down when qualification happens manually or only after human review.',
    solution: 'This workflow evaluates inquiry data, applies tags, and sends each lead to the right CRM pipeline stage or nurture path.',
    workflowOverview: [
      'Captures form data and normalizes lead records',
      'Applies qualification scoring and urgency rules',
      'Routes the lead into booking, nurture, or human-review paths'
    ],
    deliverables: ['workflow template', 'qualification logic map', 'handoff checklist'],
    resultsOrExpectedOutcome: ['Faster first response', 'Better sales prioritization', 'Less manual triage'],
    visibility: 'public',
    anonymized: false,
    audience: 'Agencies, service businesses, closers'
  },
  {
    slug: 'ai-booking-concierge',
    title: 'AI Booking Concierge',
    category: 'appointments-customer-support',
    summary: 'Handles booking requests, FAQ replies, reminders, and appointment routing from one automation layer.',
    businessOutcome: 'Convert more inbound interest into booked calls without manual calendar babysitting.',
    platforms: ['GHL', 'n8n', 'Claude worker'],
    thumbnail: 'Inquiry, qualification, reminder, and booking in one flow.',
    youtubeUrl: 'https://www.youtube.com/watch?v=ysz5S6PUM-U',
    priceLabel: '$169 system',
    paymentLink: 'https://buy.stripe.com/test_00g000000000000000',
    problem: 'Scheduling falls apart when inquiry handling, reminders, and reschedules sit in separate systems.',
    solution: 'This booking concierge unifies inbound qualification, booking links, reminders, and reschedule handling into one automated service layer.',
    workflowOverview: [
      'Receives inquiries from forms or chat entry points',
      'Answers simple questions and qualifies intent before booking',
      'Sends reminders and routes no-show or reschedule scenarios'
    ],
    deliverables: ['workflow system', 'message templates', 'calendar routing setup'],
    resultsOrExpectedOutcome: ['Higher booking completion', 'Fewer manual follow-ups', 'Cleaner appointment operations'],
    visibility: 'public',
    anonymized: false,
    audience: 'Clinics, agencies, local service teams',
    featured: true
  },
  {
    slug: 'whatsapp-support-triage',
    title: 'WhatsApp Support Triage',
    category: 'appointments-customer-support',
    summary: 'Classifies support conversations and routes them to the right SOP, teammate, or escalation lane.',
    businessOutcome: 'Respond faster while keeping repetitive support work off your team’s plate.',
    platforms: ['Make', 'Claude worker', 'GHL'],
    thumbnail: 'Chat support sorted by urgency, intent, and next action.',
    youtubeUrl: 'https://www.youtube.com/watch?v=ysz5S6PUM-U',
    priceLabel: '$99 template',
    paymentLink: 'https://buy.stripe.com/test_00g000000000000000',
    problem: 'Support channels become noisy when every message arrives unstructured.',
    solution: 'The triage layer tags message types, suggests answers, and sends higher-risk cases to a human queue with context.',
    workflowOverview: [
      'Receives WhatsApp events and classifies the message type',
      'Matches the request to SOPs, FAQs, or escalation rules',
      'Creates human-readable handoff summaries where needed'
    ],
    deliverables: ['support workflow', 'triage prompt logic', 'handoff templates'],
    resultsOrExpectedOutcome: ['Faster triage', 'Better escalation context', 'Reduced repetitive replies'],
    visibility: 'anonymized',
    anonymized: true,
    audience: 'Support teams and operations managers'
  },
  {
    slug: 'invoice-follow-up-copilot',
    title: 'Invoice Follow-up Copilot',
    category: 'productivity-admin',
    summary: 'Tracks unpaid invoices, drafts chase sequences, and updates internal status boards automatically.',
    businessOutcome: 'Reduce payment delays without turning follow-up into a full-time admin task.',
    platforms: ['Make', 'Zapier', 'Claude worker'],
    thumbnail: 'Invoice status changes trigger the right follow-up motion.',
    youtubeUrl: 'https://www.youtube.com/watch?v=ysz5S6PUM-U',
    priceLabel: '$89 template',
    paymentLink: 'https://buy.stripe.com/test_00g000000000000000',
    problem: 'Invoice chasing is repetitive, awkward, and often inconsistent across clients.',
    solution: 'The system watches invoice state changes, sends the right reminder sequence, and logs each touchpoint for the team.',
    workflowOverview: [
      'Monitors invoice due dates and payment status',
      'Drafts reminders based on aging and account context',
      'Updates finance or project tracking boards automatically'
    ],
    deliverables: ['workflow template', 'reminder sequence copy', 'reporting view setup'],
    resultsOrExpectedOutcome: ['Fewer overdue invoices', 'Clearer finance status', 'Less manual admin time'],
    visibility: 'public',
    anonymized: false,
    audience: 'Agencies, freelancers, service businesses'
  },
  {
    slug: 'ops-approval-rail',
    title: 'Ops Approval Rail',
    category: 'productivity-admin',
    summary: 'Moves requests through intake, approval, revision, and final handoff without Slack chaos.',
    businessOutcome: 'Give operations requests one reliable path from idea to approved execution.',
    platforms: ['n8n', 'Make'],
    thumbnail: 'Requests enter once and move through approvals automatically.',
    youtubeUrl: 'https://www.youtube.com/watch?v=ysz5S6PUM-U',
    priceLabel: '$109 template',
    paymentLink: 'https://buy.stripe.com/test_00g000000000000000',
    problem: 'Operational requests often get lost between DMs, documents, and manual reminders.',
    solution: 'This rail centralizes request intake, approvals, revision tracking, and final notifications into one process.',
    workflowOverview: [
      'Captures a structured request and assigns ownership',
      'Routes approval decisions with status tracking',
      'Notifies stakeholders when a request changes stage'
    ],
    deliverables: ['workflow template', 'request form schema', 'status automation map'],
    resultsOrExpectedOutcome: ['Clearer accountability', 'Fewer missed requests', 'Faster turnaround'],
    visibility: 'anonymized',
    anonymized: true,
    audience: 'Operations and admin teams'
  },
  {
    slug: 'claude-sop-copilot',
    title: 'Claude SOP Copilot',
    category: 'ai-agents-internal-tools',
    summary: 'Turns internal documentation into a practical assistant that answers workflow questions with context.',
    businessOutcome: 'Reduce tribal knowledge dependency and speed up delivery decisions.',
    platforms: ['Claude worker', 'n8n'],
    thumbnail: 'Internal docs become a usable day-to-day copilot.',
    youtubeUrl: 'https://www.youtube.com/watch?v=ysz5S6PUM-U',
    priceLabel: '$189 system',
    paymentLink: 'https://buy.stripe.com/test_00g000000000000000',
    problem: 'Teams lose time hunting for process answers buried across docs and chat threads.',
    solution: 'This copilot indexes SOPs, generates grounded answers, and keeps response context tied to internal process sources.',
    workflowOverview: [
      'Indexes documentation sources into a retrieval-ready workflow',
      'Answers team questions with grounded SOP context',
      'Escalates low-confidence requests for human review'
    ],
    deliverables: ['agent workflow', 'prompt chain', 'source-ingestion checklist'],
    resultsOrExpectedOutcome: ['Less repeated explanation', 'Faster onboarding', 'Better process consistency'],
    visibility: 'public',
    anonymized: false,
    audience: 'Internal teams, agencies, operators',
    featured: true
  },
  {
    slug: 'proposal-builder-agent',
    title: 'Proposal Builder Agent',
    category: 'ai-agents-internal-tools',
    summary: 'Builds proposal drafts from discovery data, offer templates, and pricing rules.',
    businessOutcome: 'Turn discovery calls into client-ready proposals without starting from a blank doc.',
    platforms: ['Claude worker', 'Zapier', 'Google Workspace'],
    thumbnail: 'Discovery notes become polished proposals faster.',
    youtubeUrl: 'https://www.youtube.com/watch?v=ysz5S6PUM-U',
    priceLabel: '$159 template',
    paymentLink: 'https://buy.stripe.com/test_00g000000000000000',
    problem: 'Proposal writing gets slow and inconsistent when every deal is built from scratch.',
    solution: 'The agent converts structured intake data into reusable proposal drafts aligned to service tiers and context.',
    workflowOverview: [
      'Pulls discovery notes and offer scope into a proposal brief',
      'Builds draft structure with pricing and delivery framing',
      'Exports into docs for review and send-off'
    ],
    deliverables: ['agent workflow', 'proposal prompt kit', 'document output template'],
    resultsOrExpectedOutcome: ['Faster proposal turnaround', 'More consistent sales documents', 'Less blank-page work'],
    visibility: 'anonymized',
    anonymized: true,
    audience: 'Consultants, agencies, automation service providers'
  },
  {
    slug: 'ghl-reactivation-engine',
    title: 'GHL Reactivation Engine',
    category: 'crm-follow-up-automation',
    summary: 'Reactivates dormant leads with segmented follow-up logic, personalized messaging, and booking prompts.',
    businessOutcome: 'Recover pipeline value already sitting inside your CRM.',
    platforms: ['GHL', 'Claude worker', 'Zapier'],
    thumbnail: 'Dormant leads return to active pipeline with the right sequence.',
    youtubeUrl: 'https://www.youtube.com/watch?v=ysz5S6PUM-U',
    priceLabel: '$179 system',
    paymentLink: 'https://buy.stripe.com/test_00g000000000000000',
    problem: 'Most CRMs are full of leads that never get a thoughtful second chance.',
    solution: 'This reactivation engine segments stale leads, personalizes the comeback angle, and routes engagement back into the active pipeline.',
    workflowOverview: [
      'Segments dormant records by context and buyer intent',
      'Launches the right follow-up sequence for each segment',
      'Pushes re-engaged leads back into live pipeline stages'
    ],
    deliverables: ['GHL automation map', 'sequence prompts', 'reactivation dashboard setup'],
    resultsOrExpectedOutcome: ['Recovered lead value', 'Cleaner CRM motion', 'Better sales follow-up consistency'],
    visibility: 'public',
    anonymized: false,
    audience: 'Sales teams, agencies, GHL-heavy businesses',
    featured: true
  },
  {
    slug: 'crm-handoff-guardrail',
    title: 'CRM Handoff Guardrail',
    category: 'crm-follow-up-automation',
    summary: 'Prevents dropped leads by validating stage changes, missing data, and handoff readiness before records move forward.',
    businessOutcome: 'Keep your CRM clean and your client-facing follow-up reliable.',
    platforms: ['GHL', 'Make', 'n8n'],
    thumbnail: 'No record moves forward without the right context.',
    youtubeUrl: 'https://www.youtube.com/watch?v=ysz5S6PUM-U',
    priceLabel: '$129 template',
    paymentLink: 'https://buy.stripe.com/test_00g000000000000000',
    problem: 'Leads get lost when stage changes happen without the required notes, tasks, or context.',
    solution: 'The guardrail validates records before handoff and creates the missing tasks or alerts automatically.',
    workflowOverview: [
      'Checks CRM stage changes against handoff requirements',
      'Creates missing tasks, notes, or reminders automatically',
      'Alerts the right teammate when a handoff is incomplete'
    ],
    deliverables: ['CRM workflow', 'validation rules', 'handoff checklist'],
    resultsOrExpectedOutcome: ['Fewer dropped leads', 'Better internal handoff quality', 'Cleaner CRM hygiene'],
    visibility: 'anonymized',
    anonymized: true,
    audience: 'RevOps teams, setters, closers'
  }
]

export const homeCatalogContent = {
  eyebrow: 'Automation systems, packaged like products',
  headline: 'A catalog of workflow systems built to sell, scale, and support service businesses.',
  subheadline: 'Explore curated automation systems across content, lead generation, appointments, admin ops, AI agents, and CRM follow-up. Every system is structured like a deliverable, not a vague portfolio entry.',
  featuredCategoriesLabel: 'Browse by business outcome',
  featuredProjectsLabel: 'Featured systems',
  processLabel: 'How these systems are delivered',
  processSteps: [
    'Each system is framed around a business outcome first, not just a tool stack.',
    'Private client work is anonymized while preserving the workflow logic and deliverables.',
    'Every detail page is built to show what the system does, how it works, and what a buyer gets.'
  ],
  finalCtaTitle: 'Need one of these adapted to your workflow?',
  finalCtaBody: 'Use the catalog to find the closest-fit system, then we can adapt the stack, channels, and handoff logic to your process.',
  finalCtaPrimary: 'Browse all systems',
  finalCtaSecondary: 'Book a discovery call'
}

export const allPlatforms = Array.from(
  new Set(catalogProjects.flatMap(project => project.platforms)),
)

export const getCategoryBySlug = (slug: string) =>
  catalogCategories.find(category => category.slug === slug)

export const getProjectsByCategory = (categorySlug: string) =>
  catalogProjects.filter(project => project.category === categorySlug)

export const getProjectBySlugs = (categorySlug: string, projectSlug: string) =>
  catalogProjects.find(project => project.category === categorySlug && project.slug === projectSlug)

export const getFeaturedProjects = () =>
  catalogProjects.filter(project => project.featured)
