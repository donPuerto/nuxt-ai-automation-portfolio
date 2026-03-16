export interface ExpertiseGroup {
  title: string
  description: string
  skills: string[]
}

export const expertiseGroups: ExpertiseGroup[] = [
  {
    title: 'Full Stack Development',
    description: 'Production apps and client-facing platforms built across modern React and Vue ecosystems.',
    skills: ['React/Next', 'Vue/Nuxt'],
  },
  {
    title: 'Back End',
    description: 'Backend infrastructure and app logic for authenticated tools, portals, and workflow-backed products.',
    skills: ['Supabase', 'Laravel'],
  },
  {
    title: 'Mobile',
    description: 'Cross-platform mobile delivery for workflows, admin tools, and service-business utilities.',
    skills: ['React Native', 'Flutter'],
  },
]

export const expertiseHighlights = [
  'React/Next',
  'Vue/Nuxt',
  'Supabase',
  'Laravel',
  'React Native',
  'Flutter',
]
