import { getSupabaseAdmin } from '../../utils/supabase-admin'
import { requireSupabaseUser } from '../../utils/knowledge-auth'

export default defineEventHandler(async (event) => {
  const authUser = await requireSupabaseUser(event)
  const supabase = getSupabaseAdmin(event)

  const [profileResult, preferencesResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('first_name,last_name,nickname,email,mobile_number,phone_number,work_description')
      .eq('id', authUser.id)
      .maybeSingle(),
    supabase
      .from('user_settings')
      .select('notify_response_completions,notify_web_app_emails,notify_dispatch_messages,welcome_seen,color_mode,font_family,agent_provider,agent_model')
      .eq('user_id', authUser.id)
      .maybeSingle(),
  ])

  if (profileResult.error) {
    throw createError({ statusCode: 500, statusMessage: profileResult.error.message })
  }
  if (preferencesResult.error) {
    throw createError({ statusCode: 500, statusMessage: preferencesResult.error.message })
  }

  return {
    profile: profileResult.data,
    preferences: preferencesResult.data,
  }
})
