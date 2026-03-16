export type CatalogPlatformFolder =
  | 'n8n'
  | 'claude-worker'
  | 'ghl'
  | 'zapier'
  | 'make'
  | 'full-stack'
  | 'mobile'

export interface CatalogCategory {
  slug: string
  title: string
  shortTitle: string
  description: string
  icon: string
  accentFrom: string
  accentTo: string
}

export interface CatalogProjectOffer {
  title: string
  summary: string
  priceLabel: string
  ctaLabel: string
  paymentLink: string
  originalPriceLabel?: string
  bullets?: readonly string[]
}

export interface CatalogProjectAccess {
  enabled?: boolean
  eyebrow?: string
  headline?: string
  subheadline?: string
  checkoutLabel?: string
  checkoutUrl?: string
  includes?: string[]
  guarantee?: string
  supportNote?: string
  upsells?: CatalogProjectOffer[]
  bundleOffer?: CatalogProjectOffer
}

export interface CatalogProject {
  slug: string
  title: string
  primaryPlatform: CatalogPlatformFolder
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
  access?: CatalogProjectAccess
}
