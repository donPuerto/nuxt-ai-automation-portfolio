import { getSupabaseAdmin } from '../../../utils/supabase-admin'
import { requireSupabaseUser } from '../../../utils/knowledge-auth'
import { deleteProjectKnowledge } from '../../../utils/knowledge-project-sync'

export default defineEventHandler(async (event) => {
  await requireSupabaseUser(event)
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Project slug is required.' })
  }

  const supabase = getSupabaseAdmin(event)
  const deleted = await deleteProjectKnowledge(supabase, slug)

  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: `No knowledge document found for project "${slug}".` })
  }

  return { ok: true, slug }
})
