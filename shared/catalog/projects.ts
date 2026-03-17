import claudeSopCopilot from '../projects/claude-worker/claude-sop-copilot.json'
import proposalBuilderAgent from '../projects/claude-worker/proposal-builder-agent.json'
import appointmentConfirmationReminder from '../projects/ghl/appointment-confirmation-reminder.json'
import ghlReactivationEngine from '../projects/ghl/ghl-reactivation-engine.json'
import leadFollowUpSequence from '../projects/ghl/lead-follow-up-sequence.json'
import leadIntakeQualificationRouter from '../projects/ghl/lead-intake-qualification-router.json'
import nppRequestMultilingualSequence from '../projects/ghl/npp-request-multilingual-sequence.json'
import onboardingFormZapBridge from '../projects/ghl/onboarding-form-zap-bridge.json'
import pipelineSyncGhlToMycase from '../projects/ghl/pipeline-sync-ghl-to-mycase.json'
import pipelineSyncMycaseToGhl from '../projects/ghl/pipeline-sync-mycase-to-ghl.json'
import preApprovalFormIntake from '../projects/ghl/pre-approval-form-intake.json'
import rescheduleBookingWorkflow from '../projects/ghl/reschedule-booking-workflow.json'
import unableToScheduleDrip from '../projects/ghl/unable-to-schedule-drip.json'
import upcomingAppointmentByPreference from '../projects/ghl/upcoming-appointment-by-preference.json'
import crmHandoffGuardrail from '../projects/ghl/crm-handoff-guardrail.json'
import invoiceFollowUpCopilot from '../projects/make/invoice-follow-up-copilot.json'
import whatsappSupportTriage from '../projects/make/whatsapp-support-triage.json'
import aiBookingConcierge from '../projects/n8n/ai-booking-concierge.json'
import linkedinOutreachOrchestrator from '../projects/n8n/linkedin-outreach-orchestrator.json'
import opsApprovalRail from '../projects/n8n/ops-approval-rail.json'
import podcastPublisherEngine from '../projects/n8n/podcast-publisher-engine.json'
import socialRepurposingFactory from '../projects/zapier/social-repurposing-factory.json'
import type { CatalogPlatformFolder, CatalogProject } from './types'

const asCatalogProject = (project: CatalogProject) => project

export const platformLabels: Record<CatalogPlatformFolder, string> = {
  'n8n': 'n8n',
  'claude-worker': 'Claude worker',
  'ghl': 'GHL',
  'zapier': 'Zapier',
  'make': 'Make',
  'full-stack': 'Full stack',
  'mobile': 'Mobile',
  
}
export const getPlatformLabel = (platform: CatalogPlatformFolder) =>
  platformLabels[platform]

export const catalogProjects = [
  asCatalogProject(podcastPublisherEngine as CatalogProject),
  asCatalogProject(socialRepurposingFactory as CatalogProject),
  asCatalogProject(linkedinOutreachOrchestrator as CatalogProject),
  asCatalogProject(leadIntakeQualificationRouter as CatalogProject),
  asCatalogProject(aiBookingConcierge as CatalogProject),
  asCatalogProject(whatsappSupportTriage as CatalogProject),
  asCatalogProject(invoiceFollowUpCopilot as CatalogProject),
  asCatalogProject(opsApprovalRail as CatalogProject),
  asCatalogProject(claudeSopCopilot as CatalogProject),
  asCatalogProject(proposalBuilderAgent as CatalogProject),
  asCatalogProject(ghlReactivationEngine as CatalogProject),
  asCatalogProject(crmHandoffGuardrail as CatalogProject),
  asCatalogProject(pipelineSyncMycaseToGhl as CatalogProject),
  asCatalogProject(nppRequestMultilingualSequence as CatalogProject),
  asCatalogProject(appointmentConfirmationReminder as CatalogProject),
  asCatalogProject(leadFollowUpSequence as CatalogProject),
  asCatalogProject(upcomingAppointmentByPreference as CatalogProject),
  asCatalogProject(pipelineSyncGhlToMycase as CatalogProject),
  asCatalogProject(unableToScheduleDrip as CatalogProject),
  asCatalogProject(preApprovalFormIntake as CatalogProject),
  asCatalogProject(onboardingFormZapBridge as CatalogProject),
  asCatalogProject(rescheduleBookingWorkflow as CatalogProject),
] satisfies CatalogProject[]

export const allPlatforms = Array.from(
  new Set(catalogProjects.map(project => getPlatformLabel(project.primaryPlatform))),
)
