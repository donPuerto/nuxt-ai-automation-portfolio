import type { User } from '@supabase/supabase-js'

export type SettingsSectionId = 'general' | 'account' | 'knowledge-base'

export interface UserProfileForm {
  firstName: string
  lastName: string
  nickname: string
  email: string
  mobileNumber: string
  phoneNumber: string
  workDescription: string
}

export interface UserPreferencesForm {
  notifyResponseCompletions: boolean
  notifyWebAppEmails: boolean
  notifyDispatchMessages: boolean
  welcomeSeen: boolean
  colorMode: 'light' | 'dark' | 'system'
  fontFamily: string
  agentProvider: 'openrouter' | 'claude' | 'openai'
  agentModel: string
}

const DEFAULT_CLAUDE_SANS_FONT = '"Anthropic Sans", system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'

const createDefaultProfile = (): UserProfileForm => ({
  firstName: '',
  lastName: '',
  nickname: '',
  email: '',
  mobileNumber: '',
  phoneNumber: '',
  workDescription: '',
})

const createDefaultPreferences = (): UserPreferencesForm => ({
  notifyResponseCompletions: true,
  notifyWebAppEmails: false,
  notifyDispatchMessages: false,
  welcomeSeen: false,
  colorMode: 'system',
  fontFamily: DEFAULT_CLAUDE_SANS_FONT,
  agentProvider: 'openrouter',
  agentModel: 'openrouter-free',
})

const normalizeFontFamily = (value: unknown): string => {
  const normalized = String(value ?? '').trim()
  if (!normalized) {
    return DEFAULT_CLAUDE_SANS_FONT
  }

  const lower = normalized.toLowerCase()
  if (
    lower === 'sans'
    || lower === 'var(--font-sans)'
    || lower === '--font-sans'
    || lower === 'font-sans'
  ) {
    return DEFAULT_CLAUDE_SANS_FONT
  }

  return normalized
}

const normalizeNullableText = (value: string): string | null => {
  const normalized = value.trim()
  return normalized.length ? normalized : null
}

const isValidEmail = (value: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

const applyProfile = (
  profile: ReturnType<typeof useState<UserProfileForm>>,
  row: Record<string, unknown> | null,
) => {
  if (!row) {
    profile.value = createDefaultProfile()
    return
  }

  profile.value = {
    firstName: String(row.first_name ?? ''),
    lastName: String(row.last_name ?? ''),
    nickname: String(row.nickname ?? ''),
    email: String(row.email ?? ''),
    mobileNumber: String(row.mobile_number ?? ''),
    phoneNumber: String(row.phone_number ?? ''),
    workDescription: String(row.work_description ?? ''),
  }
}

const applyPreferences = (
  preferences: ReturnType<typeof useState<UserPreferencesForm>>,
  row: Record<string, unknown> | null,
) => {
  if (!row) {
    preferences.value = createDefaultPreferences()
    return
  }

  const colorMode = row.color_mode
  const normalizedColorMode = colorMode === 'light' || colorMode === 'dark' || colorMode === 'system'
    ? colorMode
    : 'system'
  const agentProviderRaw = row.agent_provider
  const normalizedAgentProvider = agentProviderRaw === 'claude' || agentProviderRaw === 'openai' || agentProviderRaw === 'openrouter'
    ? agentProviderRaw
    : 'openrouter'

  preferences.value = {
    notifyResponseCompletions: Boolean(row.notify_response_completions ?? true),
    notifyWebAppEmails: Boolean(row.notify_web_app_emails ?? false),
    notifyDispatchMessages: Boolean(row.notify_dispatch_messages ?? false),
    welcomeSeen: Boolean(row.welcome_seen ?? false),
    colorMode: normalizedColorMode,
    fontFamily: normalizeFontFamily(row.font_family ?? createDefaultPreferences().fontFamily),
    agentProvider: normalizedAgentProvider,
    agentModel: String(row.agent_model ?? createDefaultPreferences().agentModel),
  }
}

export const useUserSettings = () => {
  const isConfigured = useSupabaseConfigured()
  const user = useState<User | null>('settings-user', () => null)
  const profile = useState<UserProfileForm>('settings-profile', createDefaultProfile)
  const preferences = useState<UserPreferencesForm>('settings-preferences', createDefaultPreferences)
  const loading = useState<boolean>('settings-loading', () => false)
  const initialized = useState<boolean>('settings-initialized', () => false)

  const isAuthenticated = computed(() => Boolean(user.value))

  const getSupabase = () => {
    if (!isConfigured) {
      throw new Error('Supabase is not configured. Set NUXT_PUBLIC_SUPABASE_URL and NUXT_PUBLIC_SUPABASE_KEY.')
    }

    return useSupabaseClient()
  }

  const loadSettings = async () => {
    loading.value = true

    try {
      if (!isConfigured) {
        user.value = null
        profile.value = createDefaultProfile()
        preferences.value = createDefaultPreferences()
        initialized.value = true
        return
      }

      const supabase = getSupabase()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        user.value = null
        profile.value = createDefaultProfile()
        preferences.value = createDefaultPreferences()
        initialized.value = true
        return
      }

      user.value = session.user

      const data = await $fetch('/api/user/settings', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      applyProfile(profile, data.profile as Record<string, unknown> | null)
      applyPreferences(preferences, data.preferences as Record<string, unknown> | null)
      initialized.value = true
    }
    catch (error) {
      const err = error as { statusCode?: number }
      if (err?.statusCode === 401) {
        await getSupabase().auth.signOut({ scope: 'local' }).catch(() => null)
        user.value = null
        profile.value = createDefaultProfile()
        preferences.value = createDefaultPreferences()
        initialized.value = true
        return
      }
      throw error
    }
    finally {
      loading.value = false
    }
  }

  const saveGeneral = async () => {
    if (!isConfigured) {
      throw new Error('Supabase is not configured. Set NUXT_PUBLIC_SUPABASE_URL and NUXT_PUBLIC_SUPABASE_KEY.')
    }

    if (!user.value) {
      throw new Error('You must be signed in to update settings.')
    }
    const supabase = getSupabase()

    if (profile.value.email.trim().length > 0 && !isValidEmail(profile.value.email)) {
      throw new Error('Please provide a valid email address.')
    }

    const payload = {
      id: user.value.id,
      first_name: normalizeNullableText(profile.value.firstName),
      last_name: normalizeNullableText(profile.value.lastName),
      nickname: normalizeNullableText(profile.value.nickname),
      email: normalizeNullableText(profile.value.email),
      mobile_number: normalizeNullableText(profile.value.mobileNumber),
      phone_number: normalizeNullableText(profile.value.phoneNumber),
      work_description: normalizeNullableText(profile.value.workDescription),
    }

    const { error } = await supabase.from('profiles').upsert(payload)

    if (error) {
      throw error
    }
  }

  const saveNotifications = async () => {
    if (!isConfigured) {
      throw new Error('Supabase is not configured. Set NUXT_PUBLIC_SUPABASE_URL and NUXT_PUBLIC_SUPABASE_KEY.')
    }

    if (!user.value) {
      throw new Error('You must be signed in to update settings.')
    }
    const supabase = getSupabase()

    const { error } = await supabase.from('user_settings').upsert({
      user_id: user.value.id,
      notify_response_completions: preferences.value.notifyResponseCompletions,
      notify_web_app_emails: preferences.value.notifyWebAppEmails,
      notify_dispatch_messages: preferences.value.notifyDispatchMessages,
    })

    if (error) {
      throw error
    }
  }

  const saveAppearance = async () => {
    if (!isConfigured) {
      throw new Error('Supabase is not configured. Set NUXT_PUBLIC_SUPABASE_URL and NUXT_PUBLIC_SUPABASE_KEY.')
    }

    if (!user.value) {
      throw new Error('You must be signed in to update settings.')
    }
    const supabase = getSupabase()

    const { error } = await supabase.from('user_settings').upsert({
      user_id: user.value.id,
      color_mode: preferences.value.colorMode,
      font_family: preferences.value.fontFamily,
      agent_provider: preferences.value.agentProvider,
      agent_model: preferences.value.agentModel,
    })

    if (error) {
      throw error
    }
  }

  const markWelcomeSeen = async () => {
    if (!isConfigured) {
      throw new Error('Supabase is not configured. Set NUXT_PUBLIC_SUPABASE_URL and NUXT_PUBLIC_SUPABASE_KEY.')
    }

    if (!user.value) {
      throw new Error('You must be signed in to update settings.')
    }

    const supabase = getSupabase()
    preferences.value.welcomeSeen = true

    const { error } = await supabase.from('user_settings').upsert({
      user_id: user.value.id,
      welcome_seen: true,
    })

    if (error) {
      preferences.value.welcomeSeen = false
      throw error
    }
  }

  const signOut = async (scope: 'local' | 'others' | 'global' = 'local') => {
    if (!isConfigured) {
      return
    }

    const supabase = getSupabase()
    const { error } = await supabase.auth.signOut({ scope })

    if (error) {
      throw error
    }

    if (scope !== 'others') {
      user.value = null
      profile.value = createDefaultProfile()
      preferences.value = createDefaultPreferences()
    }
  }

  return {
    user,
    profile,
    preferences,
    loading,
    initialized,
    isAuthenticated,
    loadSettings,
    saveGeneral,
    saveNotifications,
    saveAppearance,
    markWelcomeSeen,
    signOut,
  }
}
