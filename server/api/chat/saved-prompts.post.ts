import { getSupabaseAdmin } from '../../utils/supabase-admin'
import { requireSupabaseUser } from '../../utils/knowledge-auth'

type SavedPromptBody = {
  label?: string
  prompt?: string
}

const normalizeText = (value: unknown) => {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim()
}

const buildLabel = (label: string, prompt: string) => {
  const candidate = label || prompt

  if (candidate.length <= 72) {
    return candidate
  }

  return `${candidate.slice(0, 69).trimEnd()}...`
}

export default defineEventHandler(async (event) => {
  const user = await requireSupabaseUser(event)
  const supabase = getSupabaseAdmin(event)
  const body = (await readBody<SavedPromptBody>(event)) ?? {}

  const prompt = normalizeText(body.prompt)
  const label = buildLabel(normalizeText(body.label), prompt)

  if (!prompt) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Prompt text is required.',
    })
  }

  const timestamp = new Date().toISOString()

  const { data: existing, error: existingError } = await supabase
    .from('saved_prompts')
    .select('id')
    .eq('user_id', user.id)
    .eq('prompt', prompt)
    .maybeSingle()

  if (existingError) {
    throw createError({
      statusCode: 500,
      statusMessage: existingError.message,
    })
  }

  const payload = {
    user_id: user.id,
    label,
    prompt,
    last_used_at: timestamp,
  }

  const query = existing?.id
    ? supabase.from('saved_prompts').update(payload).eq('id', existing.id)
    : supabase.from('saved_prompts').insert(payload)

  const { data, error } = await query
    .select('id,label,prompt,is_favorite,last_used_at,created_at,updated_at')
    .single()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  const { data: staleRows, error: staleRowsError } = await supabase
    .from('saved_prompts')
    .select('id')
    .eq('user_id', user.id)
    .order('last_used_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(30, 200)

  if (!staleRowsError && staleRows?.length) {
    await supabase
      .from('saved_prompts')
      .delete()
      .in('id', staleRows.map(row => row.id))
  }

  return {
    prompt: data,
  }
})
