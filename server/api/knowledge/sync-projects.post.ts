import { getSupabaseAdmin } from '../../utils/supabase-admin'
import { requireSupabaseUser } from '../../utils/knowledge-auth'
import { syncAllProjectsToKnowledge, syncProjectToKnowledge, catalogProjects } from '../../utils/knowledge-project-sync'

type SyncBody = {
  slug?: string
}

export default defineEventHandler(async (event) => {
  await requireSupabaseUser(event)
  const config = useRuntimeConfig(event)
  const body = await readBody<SyncBody>(event).catch(() => ({})) ?? {}

  const supabase = getSupabaseAdmin(event)
  const syncConfig = { openaiApiKey: config.openaiApiKey }

  // Single-project sync when slug is provided
  if (body.slug) {
    const project = catalogProjects.find(p => p.slug === body.slug)
    if (!project) {
      throw createError({ statusCode: 404, statusMessage: `Project "${body.slug}" not found in catalog.` })
    }

    const result = await syncProjectToKnowledge(project, supabase, syncConfig)
    return { ok: true, result }
  }

  // Full sync of all projects
  const report = await syncAllProjectsToKnowledge(supabase, syncConfig)
  return { ok: true, report }
})
