import type { User } from '@supabase/supabase-js'

export type SettingsSectionId = 'general' | 'notifications' | 'appearance' | 'account'

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
  colorMode: 'light' | 'dark' | 'system'
  fontFamily: string
  agentProvider: 'openrouter' | 'claude' | 'openai'
  agentModel: string
}

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
  colorMode: 'system',
  fontFamily: '"Anthropic Sans", system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  agentProvider: 'openrouter',
  agentModel: 'openrouter-free',
})

const normalizeNullableText = (value: string): string | null => {
  const normalized = value.trim()
  return normalized.length ? normalized : null
}

const isValidEmail = (value: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
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

  const applyProfile = (row: Record<string, unknown> | null) => {
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

  const applyPreferences = (row: Record<string, unknown> | null) => {
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
      colorMode: normalizedColorMode,
      fontFamily: String(row.font_family ?? createDefaultPreferences().fontFamily),
      agentProvider: normalizedAgentProvider,
      agentModel: String(row.agent_model ?? createDefaultPreferences().agentModel),
    }
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
      const { data: authData, error: authError } = await supabase.auth.getUser()

      if (authError) {
        throw authError
      }

      const authUser = authData.user
      user.value = authUser ?? null

      if (!authUser) {
        profile.value = createDefaultProfile()
        preferences.value = createDefaultPreferences()
        initialized.value = true
        return
      }

      const [profileQuery, settingsQuery] = await Promise.all([
        supabase
          .from('profiles')
          .select('first_name,last_name,nickname,email,mobile_number,phone_number,work_description')
          .eq('id', authUser.id)
          .maybeSingle(),
        supabase
          .from('user_settings')
          .select('notify_response_completions,notify_web_app_emails,notify_dispatch_messages,color_mode,font_family,agent_provider,agent_model')
          .eq('user_id', authUser.id)
          .maybeSingle(),
      ])

      if (profileQuery.error) {
        throw profileQuery.error
      }

      if (settingsQuery.error) {
        throw settingsQuery.error
      }

      if (!profileQuery.data) {
        const { error: upsertProfileError } = await supabase
          .from('profiles')
          .upsert({
            id: authUser.id,
            email: authUser.email ?? null,
          })

        if (upsertProfileError) {
          throw upsertProfileError
        }
      }

      if (!settingsQuery.data) {
        const { error: upsertSettingsError } = await supabase
          .from('user_settings')
          .upsert({
            user_id: authUser.id,
            notify_response_completions: true,
            notify_web_app_emails: false,
            notify_dispatch_messages: false,
            color_mode: 'system',
            font_family: createDefaultPreferences().fontFamily,
            agent_provider: createDefaultPreferences().agentProvider,
            agent_model: createDefaultPreferences().agentModel,
          })

        if (upsertSettingsError) {
          throw upsertSettingsError
        }
      }

      const mergedProfile = profileQuery.data ?? {
        first_name: null,
        last_name: null,
        nickname: null,
        email: authUser.email ?? null,
        mobile_number: null,
        phone_number: null,
        work_description: null,
      }

      const mergedSettings = settingsQuery.data ?? {
        notify_response_completions: true,
        notify_web_app_emails: false,
        notify_dispatch_messages: false,
        color_mode: 'system',
        font_family: createDefaultPreferences().fontFamily,
        agent_provider: createDefaultPreferences().agentProvider,
        agent_model: createDefaultPreferences().agentModel,
      }

      applyProfile(mergedProfile)
      applyPreferences(mergedSettings)
      initialized.value = true
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
    signOut,
  }
}
