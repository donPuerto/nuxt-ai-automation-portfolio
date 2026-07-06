import type { Session, User } from '@supabase/supabase-js'

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

const getCurrentSupabaseProjectRef = () => {
  try {
    const config = useRuntimeConfig()
    const supabaseUrl = String(config.public.supabaseUrl ?? '').trim()

    if (!supabaseUrl) {
      return ''
    }

    return new URL(supabaseUrl).hostname.split('.')[0] ?? ''
  }
  catch {
    return ''
  }
}

const getWelcomeSeenStorageKey = (userId: string) => {
  const projectRef = getCurrentSupabaseProjectRef()
  return ['ai-portfolio', 'welcome-seen', projectRef || 'unknown', userId].join(':')
}

const readWelcomeSeenCache = (userId: string | null | undefined) => {
  if (!import.meta.client || !userId) {
    return false
  }

  return window.localStorage.getItem(getWelcomeSeenStorageKey(userId)) === 'true'
}

const writeWelcomeSeenCache = (userId: string | null | undefined, value: boolean) => {
  if (!import.meta.client || !userId) {
    return
  }

  const storageKey = getWelcomeSeenStorageKey(userId)
  if (value) {
    window.localStorage.setItem(storageKey, 'true')
    return
  }

  window.localStorage.removeItem(storageKey)
}

const toTrimmedString = (value: unknown): string => {
  return typeof value === 'string' ? value.trim() : ''
}

const deriveNamePartsFromFullName = (fullName: string) => {
  const normalized = fullName.trim()
  if (!normalized) {
    return { firstName: '', lastName: '' }
  }

  const parts = normalized.split(/\s+/).filter(Boolean)
  return {
    firstName: parts[0] ?? '',
    lastName: parts.length > 1 ? parts.slice(1).join(' ') : '',
  }
}

const createProfileFromUser = (user: User | null): UserProfileForm => {
  if (!user) {
    return createDefaultProfile()
  }

  const metadata = user.user_metadata ?? {}
  const fullName = toTrimmedString(
    metadata.full_name
    ?? metadata.name
    ?? metadata.user_name
    ?? metadata.preferred_username,
  )
  const nameParts = deriveNamePartsFromFullName(fullName)
  const firstName = toTrimmedString(metadata.first_name ?? metadata.given_name) || nameParts.firstName
  const lastName = toTrimmedString(metadata.last_name ?? metadata.family_name) || nameParts.lastName
  const nickname = toTrimmedString(
    metadata.nickname
    ?? metadata.user_name
    ?? metadata.preferred_username,
  ) || fullName || toTrimmedString(user.email).split('@')[0] || ''

  return {
    firstName,
    lastName,
    nickname,
    email: toTrimmedString(user.email ?? metadata.email),
    mobileNumber: '',
    phoneNumber: '',
    workDescription: '',
  }
}

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

const isMissingTableError = (error: { code?: string, message?: string } | null | undefined, tableName: string) => {
  if (!error) {
    return false
  }

  if (error.code === 'PGRST205') {
    return true
  }

  const message = error.message?.toLowerCase() ?? ''
  return message.includes('could not find the table')
    && message.includes(`public.${tableName}`.toLowerCase())
}

const toMissingTableMessage = (tableName: 'profiles' | 'user_settings') => {
  if (tableName === 'profiles') {
    return 'Profile settings storage is not ready in this Supabase project yet.'
  }

  return 'User settings storage is not ready in this Supabase project yet.'
}

const applyProfile = (
  profile: ReturnType<typeof useState<UserProfileForm>>,
  row: Record<string, unknown> | null,
  fallbackUser: User | null = null,
) => {
  if (!row) {
    profile.value = createProfileFromUser(fallbackUser)
    return
  }

  const fallbackProfile = createProfileFromUser(fallbackUser)
  profile.value = {
    firstName: String(row.first_name ?? fallbackProfile.firstName),
    lastName: String(row.last_name ?? fallbackProfile.lastName),
    nickname: String(row.nickname ?? fallbackProfile.nickname),
    email: String(row.email ?? fallbackProfile.email),
    mobileNumber: String(row.mobile_number ?? ''),
    phoneNumber: String(row.phone_number ?? ''),
    workDescription: String(row.work_description ?? ''),
  }
}

const applyPreferences = (
  preferences: ReturnType<typeof useState<UserPreferencesForm>>,
  row: Record<string, unknown> | null,
  fallbackUserId?: string | null,
) => {
  if (!row) {
    preferences.value = createDefaultPreferences()
    if (readWelcomeSeenCache(fallbackUserId)) {
      preferences.value.welcomeSeen = true
    }
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

  if (readWelcomeSeenCache(fallbackUserId)) {
    preferences.value.welcomeSeen = true
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

  const loadSettings = async (sessionOverride?: Session | null) => {
    if (loading.value) {
      return
    }

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
      const session = sessionOverride ?? (await supabase.auth.getSession()).data.session

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

      applyProfile(profile, data.profile as Record<string, unknown> | null, session.user)
      applyPreferences(preferences, data.preferences as Record<string, unknown> | null, session.user.id)
      initialized.value = true
    }
    catch (error) {
      const err = error as { statusCode?: number }
      if (err?.statusCode === 401) {
        user.value = sessionOverride?.user ?? user.value
        applyProfile(profile, null, user.value)
        preferences.value = createDefaultPreferences()
        if (readWelcomeSeenCache(user.value?.id)) {
          preferences.value.welcomeSeen = true
        }
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
      if (isMissingTableError(error, 'profiles')) {
        throw new Error(toMissingTableMessage('profiles'))
      }

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
      if (isMissingTableError(error, 'user_settings')) {
        throw new Error(toMissingTableMessage('user_settings'))
      }

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
      if (isMissingTableError(error, 'user_settings')) {
        throw new Error(toMissingTableMessage('user_settings'))
      }

      throw error
    }
  }

  const markWelcomeSeen = async () => {
    if (!isConfigured) {
      throw new Error('Supabase is not configured. Set NUXT_PUBLIC_SUPABASE_URL and NUXT_PUBLIC_SUPABASE_KEY.')
    }

    if (!user.value) {
      return false
    }

    const supabase = getSupabase()
    preferences.value.welcomeSeen = true
    writeWelcomeSeenCache(user.value.id, true)

    const { error } = await supabase.from('user_settings').upsert({
      user_id: user.value.id,
      welcome_seen: true,
    })

    if (error) {
      if (isMissingTableError(error, 'user_settings')) {
        return false
      }

      preferences.value.welcomeSeen = false
      writeWelcomeSeenCache(user.value.id, false)
      throw error
    }

    return true
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
