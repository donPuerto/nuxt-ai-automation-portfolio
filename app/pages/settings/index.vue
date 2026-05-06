<script setup lang="ts">
import type { SettingsSectionId } from '@/composables/useUserSettings'
import { useThemeManager } from '@/composables/useThemeManager'
import { toast } from 'vue-sonner'

const route = useRoute()
const router = useRouter()
const colorMode = useColorMode()
const { currentFonts, loadFonts } = useThemeManager()

const {
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
} = useUserSettings()

const sections: { id: SettingsSectionId, label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'account', label: 'Account' },
  { id: 'knowledge-base', label: 'Knowledge Base' },
]

const fontOptions = [
  {
    label: 'Anthropic Sans',
    value: '"Anthropic Sans", system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  {
    label: 'Inter',
    value: '"Inter", system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  {
    label: 'Plus Jakarta Sans',
    value: '"Plus Jakarta Sans", system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  {
    label: 'Space Grotesk',
    value: '"Space Grotesk", system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  {
    label: 'Manrope',
    value: '"Manrope", system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
]

const formatFontLabel = (fontStack: string): string => {
  const firstToken = fontStack.split(',')[0]?.trim().replace(/^"|"$/g, '')
  return firstToken || 'Custom font'
}

const agentProviderOptions = [
  { label: 'OpenRouter', value: 'openrouter' },
  { label: 'Claude', value: 'claude' },
  { label: 'OpenAI', value: 'openai' },
] as const

const agentModelOptions = [
  { label: 'OpenRouter (Free)', value: 'openrouter-free', provider: 'openrouter' },
  { label: 'Claude Sonnet 4.5', value: 'claude-sonnet-4-5', provider: 'claude' },
  { label: 'OpenAI GPT-4.1 mini', value: 'openai-gpt-4-1-mini', provider: 'openai' },
] as const

const filteredAgentModels = computed(() =>
  agentModelOptions.filter(item => item.provider === preferences.value.agentProvider),
)
const normalizedFontOptions = computed(() => {
  const normalizedBase = fontOptions.map(option => ({
    label: option.label,
    value: option.value.trim(),
  }))

  const selectedValue = preferences.value.fontFamily?.trim()
  if (!selectedValue) {
    return normalizedBase
  }

  const alreadyListed = normalizedBase.some(option => option.value === selectedValue)
  if (alreadyListed) {
    return normalizedBase
  }

  return [
    {
      label: `${formatFontLabel(selectedValue)} (Current)`,
      value: selectedValue,
    },
    ...normalizedBase,
  ]
})

const activeSection = ref<SettingsSectionId>('general')
const isSavingGeneral = ref(false)
const isSavingNotifications = ref(false)
const isSavingAppearance = ref(false)
const accountActionLoading = ref<'local' | 'others' | 'global' | ''>('')
const isSettingsBootstrapping = computed(() => loading.value || !initialized.value)

const setActiveSection = (section: SettingsSectionId) => {
  activeSection.value = section
  router.replace({
    query: {
      ...route.query,
      section,
    },
  })
}

const resolveSectionFromQuery = () => {
  const section = route.query.section
  if (typeof section === 'string' && sections.some(item => item.id === section)) {
    activeSection.value = section as SettingsSectionId
  }
}

const notifySuccess = (description: string) => {
  toast.success('Settings updated', {
    description,
  })
}

const notifyError = (error: unknown) => {
  const description = error instanceof Error ? error.message : 'Something went wrong. Please try again.'
  toast.error('Update failed', {
    description,
  })
}

const handleSaveGeneral = async () => {
  isSavingGeneral.value = true
  try {
    await saveGeneral()
    notifySuccess('General profile details have been saved.')
  }
  catch (error) {
    notifyError(error)
  }
  finally {
    isSavingGeneral.value = false
  }
}

const handleSaveNotifications = async () => {
  isSavingNotifications.value = true
  try {
    await saveNotifications()
    notifySuccess('Notification preferences have been saved.')
  }
  catch (error) {
    notifyError(error)
  }
  finally {
    isSavingNotifications.value = false
  }
}

const handleSaveAppearance = async () => {
  isSavingAppearance.value = true
  try {
    await saveAppearance()
    colorMode.preference = preferences.value.colorMode
    loadFonts({ sans: preferences.value.fontFamily })
    notifySuccess('Appearance preferences have been saved.')
  }
  catch (error) {
    notifyError(error)
  }
  finally {
    isSavingAppearance.value = false
  }
}

const handleAccountSignOut = async (scope: 'local' | 'others' | 'global') => {
  accountActionLoading.value = scope
  try {
    await signOut(scope)
    if (scope === 'local' || scope === 'global') {
      await navigateTo('/login')
      return
    }
    notifySuccess('Other sessions were signed out.')
  }
  catch (error) {
    notifyError(error)
  }
  finally {
    accountActionLoading.value = ''
  }
}

// Resolve section from URL immediately (not deferred to onMounted)
resolveSectionFromQuery()

// Load settings via useAsyncData — server: false because we need the client session
useAsyncData('user-settings', loadSettings, { server: false, lazy: true })

// Apply theme preferences once settings are ready
watch(initialized, (isInit) => {
  if (!isInit || !isAuthenticated.value) return
  colorMode.preference = preferences.value.colorMode
  loadFonts({ sans: preferences.value.fontFamily })
})

watch(
  () => route.query.section,
  () => {
    resolveSectionFromQuery()
  },
)

watch(
  () => currentFonts.value.sans,
  (value) => {
    if (!preferences.value.fontFamily) {
      preferences.value.fontFamily = value
    }
  },
  { immediate: true },
)

watch(
  () => preferences.value.agentProvider,
  (provider) => {
    const current = preferences.value.agentModel
    const allowed = agentModelOptions.some(item => item.provider === provider && item.value === current)
    if (!allowed) {
      const nextModel = agentModelOptions.find(item => item.provider === provider)?.value
      if (nextModel) {
        preferences.value.agentModel = nextModel
      }
    }
  },
)

watch(
  () => preferences.value.colorMode,
  (mode) => {
    colorMode.preference = mode
  },
)

watch(
  () => preferences.value.fontFamily,
  (fontFamily) => {
    loadFonts({ sans: fontFamily })
  },
  { immediate: true },
)

useSeoMeta({
  title: 'Settings | Don Puerto',
  description: 'Manage your profile, account, and knowledge base preferences.',
})

definePageMeta({
  layout: 'workspace',
  workspaceMode: 'settings',
})
</script>

<template>
  <div class="settings-page mx-auto w-full max-w-5xl px-1 py-2 font-sans md:px-2 md:py-3">
    <div class="mb-4">
      <PageBackHeader title="Settings" to="/" />
    </div>

    <Card class="border-border/70 bg-card text-card-foreground">
      <CardContent class="grid gap-0 p-0 lg:grid-cols-[13.25rem_minmax(0,1fr)]">
        <aside class="border-b border-border/60 bg-background/35 p-2.5 lg:border-r lg:border-b-0">
          <nav class="space-y-1.5">
            <Button
              v-for="section in sections"
              :key="section.id"
              variant="ghost"
              class="h-9 w-full justify-start px-3 text-sm"
              :class="
                activeSection === section.id
                  ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                  : 'text-foreground/75 hover:bg-accent/50 hover:text-foreground'
              "
              @click="setActiveSection(section.id)"
            >
              {{ section.label }}
            </Button>
          </nav>
        </aside>

        <section class="p-3 md:p-4 lg:p-5">
          <!-- ── General skeleton ── -->
          <div v-if="isSettingsBootstrapping && activeSection === 'general'" class="space-y-7">
            <div class="space-y-2">
              <Skeleton class="h-7 w-28 bg-muted" />
              <Skeleton class="h-4 w-72 bg-muted" />
            </div>

            <div class="rounded-2xl border border-border/70 bg-background/45 p-3 sm:p-4 md:p-5">
              <div class="space-y-5">
                <div class="grid gap-3 sm:gap-4 sm:grid-cols-2">
                  <div class="space-y-2">
                    <Skeleton class="h-4 w-20 bg-muted" />
                    <Skeleton class="h-11 w-full bg-muted" />
                  </div>
                  <div class="space-y-2">
                    <Skeleton class="h-4 w-20 bg-muted" />
                    <Skeleton class="h-11 w-full bg-muted" />
                  </div>
                </div>
                <div class="space-y-2">
                  <Skeleton class="h-4 w-56 bg-muted" />
                  <Skeleton class="h-11 w-full bg-muted" />
                  <Skeleton class="h-3 w-60 bg-muted" />
                </div>
                <div class="space-y-2">
                  <Skeleton class="h-4 w-48 bg-muted" />
                  <Skeleton class="h-27.5 sm:h-30 w-full bg-muted" />
                </div>
                <div class="grid gap-3 sm:gap-4 sm:grid-cols-2">
                  <div class="space-y-2">
                    <Skeleton class="h-4 w-12 bg-muted" />
                    <Skeleton class="h-11 w-full bg-muted" />
                  </div>
                  <div class="space-y-2">
                    <Skeleton class="h-4 w-28 bg-muted" />
                    <Skeleton class="h-11 w-full bg-muted" />
                  </div>
                </div>
                <div class="space-y-2">
                  <Skeleton class="h-4 w-28 bg-muted" />
                  <Skeleton class="h-11 w-full bg-muted" />
                </div>
                <div class="pt-1">
                  <Skeleton class="h-10 w-44 bg-muted" />
                </div>
              </div>
            </div>

            <Separator class="bg-border/70" />

            <div class="space-y-4">
              <div class="space-y-2">
                <Skeleton class="h-6 w-32 bg-muted" />
                <Skeleton class="h-4 w-56 bg-muted" />
              </div>
              <div class="space-y-3 rounded-xl border border-border/70 bg-card p-4">
                <div class="flex items-center justify-between gap-4">
                  <div class="space-y-1.5">
                    <Skeleton class="h-4 w-40 bg-muted" />
                    <Skeleton class="h-3 w-64 bg-muted" />
                  </div>
                  <Skeleton class="h-4 w-4 shrink-0 bg-muted" />
                </div>
                <Separator class="bg-border/60" />
                <div class="flex items-center justify-between gap-4">
                  <div class="space-y-1.5">
                    <Skeleton class="h-4 w-36 bg-muted" />
                    <Skeleton class="h-3 w-60 bg-muted" />
                  </div>
                  <Skeleton class="h-4 w-4 shrink-0 bg-muted" />
                </div>
                <Separator class="bg-border/60" />
                <div class="flex items-center justify-between gap-4">
                  <div class="space-y-1.5">
                    <Skeleton class="h-4 w-36 bg-muted" />
                    <Skeleton class="h-3 w-56 bg-muted" />
                  </div>
                  <Skeleton class="h-4 w-4 shrink-0 bg-muted" />
                </div>
              </div>
              <Skeleton class="h-10 w-52 bg-muted" />
            </div>

            <Separator class="bg-border/70" />

            <div class="space-y-4">
              <div class="space-y-2">
                <Skeleton class="h-6 w-28 bg-muted" />
                <Skeleton class="h-4 w-72 bg-muted" />
              </div>
              <div class="space-y-2">
                <Skeleton class="h-4 w-24 bg-muted" />
                <Skeleton class="h-10 w-full bg-muted" />
              </div>
              <div class="space-y-2">
                <Skeleton class="h-4 w-12 bg-muted" />
                <Skeleton class="h-10 w-full bg-muted" />
              </div>
              <div class="space-y-2">
                <Skeleton class="h-4 w-28 bg-muted" />
                <Skeleton class="h-10 w-full bg-muted" />
              </div>
              <div class="space-y-2">
                <Skeleton class="h-4 w-28 bg-muted" />
                <Skeleton class="h-10 w-full bg-muted" />
                <Skeleton class="h-3 w-64 bg-muted" />
              </div>
              <Skeleton class="h-10 w-52 bg-muted" />
            </div>
          </div>

          <!-- ── Account skeleton ── -->
          <div v-else-if="isSettingsBootstrapping && activeSection === 'account'" class="space-y-5">
            <div class="space-y-2">
              <Skeleton class="h-7 w-24 bg-muted" />
              <Skeleton class="h-4 w-80 bg-muted" />
            </div>
            <div class="space-y-3 rounded-xl border border-border/70 bg-card p-4">
              <div class="space-y-1">
                <Skeleton class="h-3 w-14 bg-muted" />
                <Skeleton class="h-4 w-64 bg-muted" />
              </div>
              <div class="space-y-1">
                <Skeleton class="h-3 w-20 bg-muted" />
                <Skeleton class="h-4 w-44 bg-muted" />
              </div>
            </div>
            <div class="grid gap-3 md:grid-cols-3">
              <Skeleton class="h-10 w-full bg-muted" />
              <Skeleton class="h-10 w-full bg-muted" />
              <Skeleton class="h-10 w-full bg-muted" />
            </div>
          </div>

          <!-- ── Knowledge Base skeleton ── -->
          <div v-else-if="isSettingsBootstrapping" class="space-y-5">
            <div class="space-y-2">
              <Skeleton class="h-7 w-40 bg-muted" />
              <Skeleton class="h-4 w-64 bg-muted" />
            </div>
            <Skeleton class="h-10 w-full bg-muted" />
            <div class="space-y-3">
              <Skeleton class="h-16 w-full bg-muted" />
              <Skeleton class="h-16 w-full bg-muted" />
            </div>
          </div>

          <!-- ── Not authenticated ── -->
          <div
            v-else-if="initialized && !isAuthenticated"
            class="rounded-xl border border-border/70 bg-background/60 p-5"
          >
            <h2 class="text-lg font-semibold text-foreground">
              Sign in required
            </h2>
            <p class="mt-2 text-sm text-muted-foreground">
              You need to sign in to manage personal settings.
            </p>
            <Button class="mt-4 bg-primary text-primary-foreground hover:bg-primary/90" @click="navigateTo('/login')">
              Go to login
            </Button>
          </div>

          <!-- ── General section ── -->
          <div v-else-if="activeSection === 'general'" class="space-y-7">
            <div>
              <h2 class="text-xl font-semibold text-foreground">
                Profile
              </h2>
              <p class="mt-1 text-sm text-muted-foreground">
                Update your profile details and response preferences.
              </p>
            </div>

            <div class="rounded-2xl border border-border/70 bg-background/45 p-3 sm:p-4 md:p-5">
              <div class="space-y-5">
                <div class="grid gap-3 sm:gap-4 sm:grid-cols-2">
                  <div class="space-y-2">
                    <Label for="first-name" class="text-[13px] font-medium text-foreground">First name</Label>
                    <Input
                      id="first-name"
                      v-model="profile.firstName"
                      class="h-11 rounded-xl border-border bg-background text-[15px] text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary/50"
                    />
                  </div>
                  <div class="space-y-2">
                    <Label for="last-name" class="text-[13px] font-medium text-foreground">Last name</Label>
                    <Input
                      id="last-name"
                      v-model="profile.lastName"
                      class="h-11 rounded-xl border-border bg-background text-[15px] text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary/50"
                    />
                  </div>
                </div>

                <div class="space-y-2">
                  <Label for="nickname" class="text-[13px] font-medium text-foreground">What should Claude call you?</Label>
                  <Input
                    id="nickname"
                    v-model="profile.nickname"
                    class="h-11 rounded-xl border-border bg-background text-[15px] text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary/50"
                  />
                  <p class="text-xs text-muted-foreground">
                    Display name is generated from first and last name.
                  </p>
                </div>

                <div class="space-y-2">
                  <Label for="work-description" class="text-[13px] font-medium text-foreground">What best describes your work?</Label>
                  <Textarea
                    id="work-description"
                    v-model="profile.workDescription"
                    rows="4"
                    class="min-h-27.5 sm:min-h-30 rounded-xl border-border bg-background text-[15px] text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary/50"
                  />
                </div>

                <div class="grid gap-3 sm:gap-4 sm:grid-cols-2">
                  <div class="space-y-2">
                    <Label for="email" class="text-[13px] font-medium text-foreground">Email</Label>
                    <Input
                      id="email"
                      v-model="profile.email"
                      type="email"
                      class="h-11 rounded-xl border-border bg-background text-[15px] text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary/50"
                    />
                  </div>
                  <div class="space-y-2">
                    <Label for="mobile" class="text-[13px] font-medium text-foreground">Mobile number</Label>
                    <Input
                      id="mobile"
                      v-model="profile.mobileNumber"
                      class="h-11 rounded-xl border-border bg-background text-[15px] text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary/50"
                    />
                  </div>
                </div>

                <div class="space-y-2">
                  <Label for="phone" class="text-[13px] font-medium text-foreground">Phone number</Label>
                  <Input
                    id="phone"
                    v-model="profile.phoneNumber"
                    class="h-11 rounded-xl border-border bg-background text-[15px] text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary/50"
                  />
                </div>

                <div class="pt-1">
                  <Button
                    class="h-10 w-full rounded-xl bg-primary px-5 text-primary-foreground hover:bg-primary/90 sm:w-auto"
                    :disabled="isSavingGeneral"
                    @click="handleSaveGeneral"
                  >
                    {{ isSavingGeneral ? 'Saving...' : 'Save general settings' }}
                  </Button>
                </div>
              </div>
            </div>

            <Separator class="bg-border/70" />

            <div id="appearance-settings" class="space-y-4">
              <div>
                <h3 class="text-lg font-semibold text-foreground">
                  Notifications
                </h3>
                <p class="mt-1 text-sm text-muted-foreground">
                  Choose which alerts should be sent to you.
                </p>
              </div>

              <div class="space-y-3 rounded-xl border border-border/70 bg-card p-4">
                <Label class="flex items-center justify-between gap-4">
                  <span class="space-y-1">
                    <span class="block text-sm font-medium">Response completions</span>
                    <span class="block text-xs text-muted-foreground">Get notified when a long-running response is completed.</span>
                  </span>
                  <Checkbox
                    :checked="preferences.notifyResponseCompletions"
                    @update:checked="preferences.notifyResponseCompletions = $event === true"
                  />
                </Label>

                <Separator class="bg-border/60" />

                <Label class="flex items-center justify-between gap-4">
                  <span class="space-y-1">
                    <span class="block text-sm font-medium">Emails from web app</span>
                    <span class="block text-xs text-muted-foreground">Get an email when web app actions need your response.</span>
                  </span>
                  <Checkbox
                    :checked="preferences.notifyWebAppEmails"
                    @update:checked="preferences.notifyWebAppEmails = $event === true"
                  />
                </Label>

                <Separator class="bg-border/60" />

                <Label class="flex items-center justify-between gap-4">
                  <span class="space-y-1">
                    <span class="block text-sm font-medium">Dispatch messages</span>
                    <span class="block text-xs text-muted-foreground">Get push notifications when there is a new dispatch message.</span>
                  </span>
                  <Checkbox
                    :checked="preferences.notifyDispatchMessages"
                    @update:checked="preferences.notifyDispatchMessages = $event === true"
                  />
                </Label>
              </div>

              <Button
                class="bg-primary text-primary-foreground hover:bg-primary/90"
                :disabled="isSavingNotifications"
                @click="handleSaveNotifications"
              >
                {{ isSavingNotifications ? 'Saving...' : 'Save notification settings' }}
              </Button>
            </div>

            <Separator class="bg-border/70" />

            <div class="space-y-4">
              <div>
                <h3 class="text-lg font-semibold text-foreground">
                  Appearance
                </h3>
                <p class="mt-1 text-sm text-muted-foreground">
                  Control color mode, font, and default assistant model.
                </p>
              </div>

              <div class="space-y-2">
                <Label for="color-mode">Color mode</Label>
                <Select v-model="preferences.colorMode">
                  <SelectTrigger id="color-mode" class="w-full border-border bg-background text-foreground">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent class="border-border bg-popover text-popover-foreground">
                    <SelectItem value="system">
                      System
                    </SelectItem>
                    <SelectItem value="light">
                      Light
                    </SelectItem>
                    <SelectItem value="dark">
                      Dark
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="space-y-2">
                <Label for="font-family">Font</Label>
                <Select v-model="preferences.fontFamily">
                  <SelectTrigger id="font-family" class="w-full border-border bg-background text-foreground">
                    <SelectValue placeholder="Select font" />
                  </SelectTrigger>
                  <SelectContent class="border-border bg-popover text-popover-foreground">
                    <SelectItem
                      v-for="font in normalizedFontOptions"
                      :key="font.value"
                      :value="font.value"
                    >
                      {{ font.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="space-y-2">
                <Label for="agent-provider">Agent provider</Label>
                <Select v-model="preferences.agentProvider">
                  <SelectTrigger id="agent-provider" class="w-full border-border bg-background text-foreground">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent class="border-border bg-popover text-popover-foreground">
                    <SelectItem
                      v-for="provider in agentProviderOptions"
                      :key="provider.value"
                      :value="provider.value"
                    >
                      {{ provider.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="space-y-2">
                <Label for="agent-model">Default model</Label>
                <Select v-model="preferences.agentModel">
                  <SelectTrigger id="agent-model" class="w-full border-border bg-background text-foreground">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent class="border-border bg-popover text-popover-foreground">
                    <SelectItem
                      v-for="model in filteredAgentModels"
                      :key="model.value"
                      :value="model.value"
                    >
                      {{ model.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p class="text-xs text-muted-foreground">
                  OpenRouter is set as the default provider for free usage.
                </p>
              </div>

              <Button
                class="bg-primary text-primary-foreground hover:bg-primary/90"
                :disabled="isSavingAppearance"
                @click="handleSaveAppearance"
              >
                {{ isSavingAppearance ? 'Saving...' : 'Save appearance settings' }}
              </Button>
            </div>
          </div>

          <!-- ── Account section ── -->
          <div v-else-if="activeSection === 'account'" class="space-y-5">
            <div>
              <h2 class="text-xl font-semibold text-foreground">
                Account
              </h2>
              <p class="mt-1 text-sm text-muted-foreground">
                Account details from your signup and active session controls.
              </p>
            </div>

            <div class="space-y-3 rounded-xl border border-border/70 bg-card p-4">
              <div>
                <p class="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  User ID
                </p>
                <p class="mt-1 text-sm text-foreground">
                  {{ user?.id }}
                </p>
              </div>

              <div>
                <p class="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  Last sign-in
                </p>
                <p class="mt-1 text-sm text-foreground">
                  {{ user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Unknown' }}
                </p>
              </div>
            </div>

            <div class="grid gap-3 md:grid-cols-3">
              <Button
                variant="outline"
                class="border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
                :disabled="accountActionLoading.length > 0"
                @click="handleAccountSignOut('local')"
              >
                {{ accountActionLoading === 'local' ? 'Signing out...' : 'Log out this device' }}
              </Button>

              <Button
                variant="outline"
                class="border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
                :disabled="accountActionLoading.length > 0"
                @click="handleAccountSignOut('others')"
              >
                {{ accountActionLoading === 'others' ? 'Signing out...' : 'Log out other devices' }}
              </Button>

              <Button
                variant="outline"
                class="border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
                :disabled="accountActionLoading.length > 0"
                @click="handleAccountSignOut('global')"
              >
                {{ accountActionLoading === 'global' ? 'Signing out...' : 'Log out all devices' }}
              </Button>
            </div>

            <div class="rounded-xl border border-border/70 bg-card p-4">
              <p class="text-sm font-medium text-foreground">
                Delete account
              </p>
              <p class="mt-1 text-xs text-muted-foreground">
                Account deletion is disabled for now. Contact support if you need immediate account removal.
              </p>
              <Button
                variant="outline"
                class="mt-3 border-border bg-muted text-muted-foreground hover:bg-muted hover:text-muted-foreground"
                disabled
              >
                Delete account
              </Button>
            </div>
          </div>

          <!-- ── Knowledge Base section ── -->
          <KnowledgeBaseSettings
            v-else
            :authenticated="isAuthenticated"
          />
        </section>
      </CardContent>
    </Card>
  </div>
</template>
