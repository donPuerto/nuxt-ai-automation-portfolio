import { personalInfo } from '../personal-info'

export const aboutKnowledge = {
  shortBio: `I'm ${personalInfo.name}, an automation specialist focused on workflow products, AI systems, and custom implementation work.`,
  firstPersonIntro: 'I build workflow products, automation projects, and custom solutions that can be sold as ready-made systems or adapted for specific clients.',
  location: personalInfo.location,
  role: personalInfo.role,
  resumeHighlights: [
    'I work across workflow design, CRM automation, AI agents, and productized automation delivery.',
    'I package workflows as products when they can be reused and scope custom builds when a client needs a tailored system.',
    'I prefer showing tangible project outputs, demo links, and buyer-ready workflow offers instead of vague portfolio summaries.',
  ],
  discoveryCallPrompt: 'If you want help choosing between an instant-access workflow and a custom build, start a discovery call and I can talk through the best fit with you.',
} as const
