import { personalInfo } from '../personal-info'

export const aboutKnowledge = {
  shortBio: `I'm ${personalInfo.name}, a freelance developer and automation specialist who helps businesses eliminate manual work and scale operations through automation and AI integration.`,
  firstPersonIntro: `Hi, I'm ${personalInfo.name} - but you can call me ${personalInfo.shortName}. I'm a freelance developer and automation specialist based in ${personalInfo.location}, with over 10 years of experience helping businesses eliminate manual work and scale their operations through smart automation and AI integration.`,
  location: personalInfo.location,
  role: personalInfo.role,
  whatIDo: [
    'I build automation systems that actually work, connecting platforms, integrating AI, and creating workflows that save hours of repetitive work every day.',
    'My specialty includes n8n workflow automation, complex integrations, API orchestration, and event-driven systems.',
    'I integrate AI with Claude API, GPT-4, and intelligent automation flows that use AI decision-making in practical ways.',
    'I work across CRM and platform integration including GoHighLevel, HubSpot, Stripe, WhatsApp, and Google Workspace.',
    'I also handle full-stack implementation with React, Node.js, Python, Supabase, and database design when the automation needs a product layer around it.',
  ],
  background: [
    'I did not start as a developer. I spent years in operations, production, warehousing, and inventory control, where I saw firsthand how manual processes break down at scale.',
    'That operational experience shaped how I build automation. I understand the business problems from the inside, not just the technology stack around them.',
    'When I moved into automation and development, I brought that operational mindset with me. I focus on where workflows break, where errors happen, and what actually needs to be automated.',
  ],
  workStyle: [
    'I work directly with clients as an independent freelancer from start to finish, not as part of an agency handoff.',
    'I stay focused on measurable outcomes: less manual work, faster processes, fewer errors, and systems that scale cleanly.',
    'I explain technical concepts clearly, provide proactive updates, and raise issues early instead of letting surprises pile up.',
    'I treat production readiness as part of the build, with error handling, monitoring, and documentation included in the real finish line.',
  ],
  differentiators: [
    'Operational experience - I have worked the processes I automate.',
    'Business thinking - I understand ROI, practical outcomes, and what teams actually need to improve.',
    'Systems mindset - I naturally look at how platforms, people, and processes connect together.',
    'AI expertise - I integrate AI strategically where it improves the workflow, not just because it is trendy.',
  ],
  techStack: [
    'Automation and integration: n8n, Make.com, Zapier, REST APIs, webhooks, OAuth2 authentication, and event-driven architecture.',
    'Development: JavaScript, Node.js, Python, React, Next.js, Vue.js, PostgreSQL, Supabase, SQL databases, Git, Docker, and cloud deployment.',
    'AI and machine learning: Claude API, OpenAI GPT-4, prompt engineering, AI workflow design, and production AI integration.',
    'Business platforms: GoHighLevel, HubSpot, Stripe, PayPal, WhatsApp Business API, email systems, and Google Workspace automation.',
  ],
  availability: [
    'Available for full-time positions around 40 hours per week.',
    'Available for part-time contracts with flexible hours.',
    'Available for project-based work with fixed scope.',
    'Best fit for teams that need to build automation from scratch, repair broken workflows, integrate AI into operations, or scale an existing system.',
  ],
  contact: [
    `Email: ${personalInfo.email}`,
    `Mobile / WhatsApp: ${personalInfo.phone}`,
    'Resume: View Resume',
    `GitHub: ${personalInfo.social.github}`,
  ],
  resumeHighlights: [
    'Freelance developer and automation specialist with 10+ years of practical business and systems experience.',
    'Builds automation, AI integrations, and platform workflows that reduce manual work and increase operational scale.',
    'Combines operations insight, business thinking, and production-ready engineering in one delivery path.',
  ],
  discoveryCallPrompt: 'If you want help choosing between an instant-access workflow and a custom build, start a discovery call and I can talk through the best fit with you.',
} as const
