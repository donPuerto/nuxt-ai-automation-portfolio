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
  { id: 'notifications', label: 'Notifications' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'account', label: 'Account' },
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

const agentProviderOptions = [
  { label: 'OpenRouter', value: 'openrouter' },
  { label: 'Claude', value: 'claude' },
  { label: 'OpenAI', value: 'openai' },
] as const

const agentModelOptions = [
  { label: 'OpenRouter (Free)', value: 'openrouter-free', provider: 'openrouter' },
  { label: 'Claude Sonnet', value: 'claude-sonnet', provider: 'claude' },
  { label: 'OpenAI GPT', value: 'openai-gpt', provider: 'openai' },
] as const

const filteredAgentModels = computed(() =>
  agentModelOptions.filter(item => item.provider === preferences.value.agentProvider),
)

const activeSection = ref<SettingsSectionId>('general')
const isSavingGeneral = ref(false)
const isSavingNotifications = ref(false)
const isSavingAppearance = ref(false)
const accountActionLoading = ref<'local' | 'others' | 'global' | ''>('')

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

onMounted(async () => {
  resolveSectionFromQuery()
  await loadSettings()

  if (!isAuthenticated.value) {
    return
  }

  colorMode.preference = preferences.value.colorMode
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

useSeoMeta({
  title: 'Settings | Don Puerto',
  description: 'Manage your profile, notifications, appearance, and account preferences.',
})
</script>

<template>
  <div class="container py-10 md:py-12">
    <div class="mx-auto max-w-6xl">
      <div class="mb-6">
        <h1 class="text-3xl font-semibold tracking-tight text-[#f0deca]">
          Settings
        </h1>
        <p class="mt-2 text-sm text-[#ab9986]">
          Manage your profile, notifications, appearance, and account preferences.
        </p>
      </div>

      <Card class="border-[#4a433d]/70 bg-[#262321] text-[#f0deca]">
        <CardContent class="grid gap-0 p-0 md:grid-cols-[15rem_minmax(0,1fr)]">
          <aside class="border-b border-[#4a433d]/60 p-3 md:border-r md:border-b-0">
            <nav class="space-y-1.5">
              <Button
                v-for="section in sections"
                :key="section.id"
                variant="ghost"
                class="h-9 w-full justify-start px-3 text-sm"
                :class="
                  activeSection === section.id
                    ? 'bg-[#161514] text-[#f6e8d4] hover:bg-[#1d1b1a]'
                    : 'text-[#d7c8b7] hover:bg-[#2d2926] hover:text-[#f3e5d1]'
                "
                @click="setActiveSection(section.id)"
              >
                {{ section.label }}
              </Button>
            </nav>
          </aside>

          <section class="p-4 md:p-6">
            <div v-if="loading" class="space-y-3">
              <Skeleton class="h-7 w-40 bg-[#3a342f]" />
              <Skeleton class="h-20 w-full bg-[#3a342f]" />
              <Skeleton class="h-20 w-full bg-[#3a342f]" />
            </div>

            <div
              v-else-if="initialized && !isAuthenticated"
              class="rounded-xl border border-[#4a433d]/70 bg-[#2b2724] p-5"
            >
              <h2 class="text-lg font-semibold text-[#fff4e6]">
                Sign in required
              </h2>
              <p class="mt-2 text-sm text-[#d3c0ab]">
                You need to sign in to manage personal settings.
              </p>
              <Button class="mt-4 bg-[#b87449] text-white hover:bg-[#c6845a]" @click="navigateTo('/login')">
                Go to login
              </Button>
            </div>

            <div v-else-if="activeSection === 'general'" class="space-y-5">
              <div>
                <h2 class="text-xl font-semibold text-[#fff4e6]">
                  General
                </h2>
                <p class="mt-1 text-sm text-[#ab9986]">
                  Update your profile details used across the app.
                </p>
              </div>

              <div class="grid gap-4 md:grid-cols-2">
                <div class="space-y-2">
                  <Label for="first-name">First name</Label>
                  <Input id="first-name" v-model="profile.firstName" class="border-[#4a433d] bg-[#221f1d] text-[#fff4e6]" />
                </div>
                <div class="space-y-2">
                  <Label for="last-name">Last name</Label>
                  <Input id="last-name" v-model="profile.lastName" class="border-[#4a433d] bg-[#221f1d] text-[#fff4e6]" />
                </div>
              </div>

              <div class="space-y-2">
                <Label for="nickname">What should I call you?</Label>
                <Input id="nickname" v-model="profile.nickname" class="border-[#4a433d] bg-[#221f1d] text-[#fff4e6]" />
              </div>

              <div class="space-y-2">
                <Label for="work-description">What best describes your work?</Label>
                <Textarea
                  id="work-description"
                  v-model="profile.workDescription"
                  rows="3"
                  class="border-[#4a433d] bg-[#221f1d] text-[#fff4e6]"
                />
              </div>

              <div class="grid gap-4 md:grid-cols-3">
                <div class="space-y-2 md:col-span-2">
                  <Label for="email">Email</Label>
                  <Input id="email" v-model="profile.email" type="email" class="border-[#4a433d] bg-[#221f1d] text-[#fff4e6]" />
                </div>
                <div class="space-y-2">
                  <Label for="mobile">Mobile number</Label>
                  <Input id="mobile" v-model="profile.mobileNumber" class="border-[#4a433d] bg-[#221f1d] text-[#fff4e6]" />
                </div>
              </div>

              <div class="space-y-2">
                <Label for="phone">Phone number</Label>
                <Input id="phone" v-model="profile.phoneNumber" class="border-[#4a433d] bg-[#221f1d] text-[#fff4e6]" />
              </div>

              <Button
                class="bg-[#b87449] text-white hover:bg-[#c6845a]"
                :disabled="isSavingGeneral"
                @click="handleSaveGeneral"
              >
                {{ isSavingGeneral ? 'Saving...' : 'Save general settings' }}
              </Button>
            </div>

            <div v-else-if="activeSection === 'notifications'" class="space-y-5">
              <div>
                <h2 class="text-xl font-semibold text-[#fff4e6]">
                  Notifications
                </h2>
                <p class="mt-1 text-sm text-[#ab9986]">
                  Choose which alerts should be sent to you.
                </p>
              </div>

              <div class="space-y-3 rounded-xl border border-[#4a433d]/70 bg-[#2b2724] p-4">
                <Label class="flex items-center justify-between gap-4">
                  <span class="space-y-1">
                    <span class="block text-sm font-medium">Response completions</span>
                    <span class="block text-xs text-[#ab9986]">Get notified when a long-running response is completed.</span>
                  </span>
                  <Checkbox
                    :checked="preferences.notifyResponseCompletions"
                    @update:checked="preferences.notifyResponseCompletions = $event === true"
                  />
                </Label>

                <Separator class="bg-[#4a433d]/60" />

                <Label class="flex items-center justify-between gap-4">
                  <span class="space-y-1">
                    <span class="block text-sm font-medium">Emails from web app</span>
                    <span class="block text-xs text-[#ab9986]">Get an email when web app actions need your response.</span>
                  </span>
                  <Checkbox
                    :checked="preferences.notifyWebAppEmails"
                    @update:checked="preferences.notifyWebAppEmails = $event === true"
                  />
                </Label>

                <Separator class="bg-[#4a433d]/60" />

                <Label class="flex items-center justify-between gap-4">
                  <span class="space-y-1">
                    <span class="block text-sm font-medium">Dispatch messages</span>
                    <span class="block text-xs text-[#ab9986]">Get push notifications when there is a new dispatch message.</span>
                  </span>
                  <Checkbox
                    :checked="preferences.notifyDispatchMessages"
                    @update:checked="preferences.notifyDispatchMessages = $event === true"
                  />
                </Label>
              </div>

              <Button
                class="bg-[#b87449] text-white hover:bg-[#c6845a]"
                :disabled="isSavingNotifications"
                @click="handleSaveNotifications"
              >
                {{ isSavingNotifications ? 'Saving...' : 'Save notification settings' }}
              </Button>
            </div>

            <div v-else-if="activeSection === 'appearance'" class="space-y-5">
              <div>
                <h2 class="text-xl font-semibold text-[#fff4e6]">
                  Appearance
                </h2>
                <p class="mt-1 text-sm text-[#ab9986]">
                  Control color mode and default font.
                </p>
              </div>

              <div class="space-y-2">
                <Label for="color-mode">Color mode</Label>
                <Select v-model="preferences.colorMode">
                  <SelectTrigger id="color-mode" class="border-[#4a433d] bg-[#221f1d] text-[#fff4e6]">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent class="border-[#4a433d] bg-[#2b2724] text-[#f0deca]">
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
                  <SelectTrigger id="font-family" class="border-[#4a433d] bg-[#221f1d] text-[#fff4e6]">
                    <SelectValue placeholder="Select font" />
                  </SelectTrigger>
                  <SelectContent class="border-[#4a433d] bg-[#2b2724] text-[#f0deca]">
                    <SelectItem
                      v-for="font in fontOptions"
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
                  <SelectTrigger id="agent-provider" class="border-[#4a433d] bg-[#221f1d] text-[#fff4e6]">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent class="border-[#4a433d] bg-[#2b2724] text-[#f0deca]">
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
                  <SelectTrigger id="agent-model" class="border-[#4a433d] bg-[#221f1d] text-[#fff4e6]">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent class="border-[#4a433d] bg-[#2b2724] text-[#f0deca]">
                    <SelectItem
                      v-for="model in filteredAgentModels"
                      :key="model.value"
                      :value="model.value"
                    >
                      {{ model.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p class="text-xs text-[#ab9986]">
                  OpenRouter is set as the default provider for free usage.
                </p>
              </div>

              <Button
                class="bg-[#b87449] text-white hover:bg-[#c6845a]"
                :disabled="isSavingAppearance"
                @click="handleSaveAppearance"
              >
                {{ isSavingAppearance ? 'Saving...' : 'Save appearance settings' }}
              </Button>
            </div>

            <div v-else class="space-y-5">
              <div>
                <h2 class="text-xl font-semibold text-[#fff4e6]">
                  Account
                </h2>
                <p class="mt-1 text-sm text-[#ab9986]">
                  Manage session security for this workspace.
                </p>
              </div>

              <div class="space-y-3 rounded-xl border border-[#4a433d]/70 bg-[#2b2724] p-4">
                <div>
                  <p class="text-xs font-medium tracking-[0.14em] text-[#8f857a] uppercase">
                    User ID
                  </p>
                  <p class="mt-1 text-sm text-[#f0deca]">
                    {{ user?.id }}
                  </p>
                </div>

                <div>
                  <p class="text-xs font-medium tracking-[0.14em] text-[#8f857a] uppercase">
                    Last sign-in
                  </p>
                  <p class="mt-1 text-sm text-[#f0deca]">
                    {{ user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Unknown' }}
                  </p>
                </div>
              </div>

              <div class="grid gap-3 md:grid-cols-3">
                <Button
                  variant="outline"
                  class="border-[#4a433d] bg-[#221f1d] text-[#f0deca] hover:bg-[#2d2926] hover:text-[#fff4e6]"
                  :disabled="accountActionLoading.length > 0"
                  @click="handleAccountSignOut('local')"
                >
                  {{ accountActionLoading === 'local' ? 'Signing out...' : 'Log out this device' }}
                </Button>

                <Button
                  variant="outline"
                  class="border-[#4a433d] bg-[#221f1d] text-[#f0deca] hover:bg-[#2d2926] hover:text-[#fff4e6]"
                  :disabled="accountActionLoading.length > 0"
                  @click="handleAccountSignOut('others')"
                >
                  {{ accountActionLoading === 'others' ? 'Signing out...' : 'Log out other devices' }}
                </Button>

                <Button
                  variant="outline"
                  class="border-[#4a433d] bg-[#221f1d] text-[#f0deca] hover:bg-[#2d2926] hover:text-[#fff4e6]"
                  :disabled="accountActionLoading.length > 0"
                  @click="handleAccountSignOut('global')"
                >
                  {{ accountActionLoading === 'global' ? 'Signing out...' : 'Log out all devices' }}
                </Button>
              </div>

              <div class="rounded-xl border border-[#4a433d]/70 bg-[#2b2724] p-4">
                <p class="text-sm font-medium text-[#fff4e6]">
                  Delete account
                </p>
                <p class="mt-1 text-xs text-[#ab9986]">
                  Account deletion is disabled for now. Contact support if you need immediate account removal.
                </p>
                <Button
                  variant="outline"
                  class="mt-3 border-[#4a433d] bg-[#221f1d] text-[#8f857a] hover:bg-[#221f1d] hover:text-[#8f857a]"
                  disabled
                >
                  Delete account
                </Button>
              </div>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
