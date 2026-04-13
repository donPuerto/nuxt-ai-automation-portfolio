<script setup lang="ts">
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'
import { aiPortfolioContent } from '@@/shared'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'vue-sonner'

const props = defineProps<{
  collapsed?: boolean
}>()

const router = useRouter()
const supabaseConfigured = useSupabaseConfigured()
const settings = supabaseConfigured ? useUserSettings() : null
const supabase = supabaseConfigured ? useSupabaseClient() : null

const menuOpen = ref(false)
const authUser = ref<User | null>(null)
const selectedLanguageId = ref<'language-en' | 'language-fil' | 'language-ceb'>('language-en')
let authSubscription: { unsubscribe: () => void } | null = null

const isAuthenticated = computed(() => Boolean(authUser.value))

const profileName = computed(() => {
  if (!isAuthenticated.value) {
    return 'Login'
  }

  const user = authUser.value
  const metadataName = user?.user_metadata?.full_name
  if (typeof metadataName === 'string' && metadataName.trim().length > 0) {
    return metadataName.trim()
  }

  const email = user?.email
  if (typeof email === 'string' && email.length > 0) {
    return email.split('@')[0] || aiPortfolioContent.sidebarProfileName
  }

  return aiPortfolioContent.sidebarProfileName
})

const profileEmail = computed(() => {
  if (!isAuthenticated.value) {
    return 'Sign in to save your workspace'
  }

  const email = authUser.value?.email
  if (typeof email === 'string' && email.length > 0) {
    return email
  }

  return aiPortfolioContent.sidebarProfileEmail
})

const profileMenuLabel = computed(() =>
  isAuthenticated.value ? aiPortfolioContent.sidebarProfileMenuLabel : 'Open login menu',
)

const initials = computed(() => {
  const name = profileName.value
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()
})

const menuItems = computed(() => {
  if (!isAuthenticated.value) {
    return [
      {
        id: 'login',
        label: 'Login',
        icon: 'lucide:log-in',
      },
    ]
  }

  return aiPortfolioContent.sidebarProfileMenuItems.map((item) => {
    if (item.id !== 'language' || item.type !== 'submenu' || !item.children) {
      return item
    }

    return {
      ...item,
      children: item.children.map(child => ({
        ...child,
        checked: child.id === selectedLanguageId.value,
      })),
    }
  })
})

const setAuthUserFromSession = (session: Session | null) => {
  authUser.value = session?.user ?? null
}

const handleMenuAction = async (id: string) => {
  if (id === 'login') {
    await router.push('/login')
    return
  }

  if (id === 'get-help') {
    toast.message('Get Help', {
      description: 'This page is coming soon.',
    })
    return
  }

  if (id === 'extensions') {
    toast.message('Extensions', {
      description: 'Connected apps view is coming soon.',
    })
    return
  }

  if (id === 'roadmap') {
    toast.message('Roadmap', {
      description: 'Roadmap page is coming soon.',
    })
    return
  }

  if (id === 'whats-new') {
    toast.message("What's New", {
      description: 'MCP updates and release notes are coming soon.',
    })
    return
  }

  if (id === 'logout') {
    if (supabase) {
      const { data } = await supabase.auth.getSession()
      const currentSession = data.session

      if (currentSession?.access_token && currentSession?.refresh_token) {
        await $fetch('/api/auth/logout', {
          method: 'POST',
          body: {
            accessToken: currentSession.access_token,
            refreshToken: currentSession.refresh_token,
          },
        }).catch(() => null)
      }
    }

    if (settings) {
      await settings.signOut('local')
    }
    authUser.value = null
    await router.push('/login')
  }
}

const handleLanguageSelect = (id: 'language-en' | 'language-fil' | 'language-ceb') => {
  if (id !== 'language-en') {
    toast.message('Language', {
      description: 'Filipino and Cebuano are visible but not available yet.',
    })
    return
  }

  selectedLanguageId.value = id
  if (import.meta.client) {
    window.localStorage.setItem('dp-preferred-language', id)
  }

  const languageLabelMap = {
    'language-en': 'English',
    'language-fil': 'Filipino',
    'language-ceb': 'Cebuano',
  } as const

  toast.message('Language updated', {
    description: `${languageLabelMap[id]} is now selected.`,
  })
}

onMounted(() => {
  if (import.meta.client) {
    const persistedLanguage = window.localStorage.getItem('dp-preferred-language')
    if (persistedLanguage === 'language-en') {
      selectedLanguageId.value = persistedLanguage
    }
    else if (persistedLanguage === 'language-fil' || persistedLanguage === 'language-ceb') {
      selectedLanguageId.value = 'language-en'
      window.localStorage.setItem('dp-preferred-language', 'language-en')
    }
  }

  if (!supabase) {
    authUser.value = null
    return
  }

  void supabase.auth.getSession().then(({ data }) => {
    setAuthUserFromSession(data.session)
  }).catch(() => {
    authUser.value = null
  })

  const { data } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
    setAuthUserFromSession(session)
  })

  authSubscription = data.subscription
})

onBeforeUnmount(() => {
  authSubscription?.unsubscribe()
  authSubscription = null
})
</script>

<template>
  <DropdownMenu v-model:open="menuOpen">
    <DropdownMenuTrigger as-child>
      <button
        type="button"
        class="w-full bg-transparent text-left text-sidebar-foreground transition hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sidebar-ring"
        :class="collapsed ? 'flex items-center justify-center px-0 py-3' : 'flex items-center gap-2 px-3 py-2.5'"
        :aria-label="profileMenuLabel"
      >
        <div
          class="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-[12px] font-semibold text-sidebar-accent-foreground"
        >
          {{ initials }}
        </div>

        <template v-if="!props.collapsed">
          <div class="min-w-0 flex-1">
            <div class="truncate text-[12.5px] font-semibold leading-none text-sidebar-foreground">
              {{ profileName }}
            </div>
            <div class="mt-1 truncate text-[11px] leading-none text-sidebar-foreground/70">
              {{ profileEmail }}
            </div>
          </div>

          <Icon name="lucide:chevrons-up-down" class="size-3.5 shrink-0 text-sidebar-foreground/75" />
        </template>
      </button>
    </DropdownMenuTrigger>

    <DropdownMenuContent
      side="right"
      align="end"
      :side-offset="8"
      class="w-[12.25rem] rounded-xl border-sidebar-border bg-sidebar p-0 text-sidebar-foreground shadow-2xl"
    >
      <div class="flex items-center gap-2 px-2.5 py-2.5">
        <div
          class="flex size-9 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-[12px] font-semibold text-sidebar-accent-foreground"
        >
          {{ initials }}
        </div>

        <div class="min-w-0">
          <div class="truncate text-[13px] font-semibold leading-none text-sidebar-foreground">
            {{ profileName }}
          </div>
          <div class="mt-1 truncate text-[11px] leading-none text-sidebar-foreground/70">
            {{ profileEmail }}
          </div>
        </div>
      </div>

      <DropdownMenuSeparator class="my-0 bg-sidebar-border" />

      <template v-for="item in menuItems" :key="item.id">
        <DropdownMenuSeparator
          v-if="'type' in item && item.type === 'separator'"
          class="my-0 bg-sidebar-border"
        />

        <DropdownMenuItem
          v-else-if="item.id === 'settings'"
          as-child
          class="gap-2 rounded-none px-2.5 py-1.5 text-[12.5px] text-sidebar-foreground/95 focus:bg-sidebar-accent focus:text-sidebar-accent-foreground"
        >
          <a href="/settings?section=general">
            <Icon v-if="item.icon" :name="item.icon" class="size-4 text-current" />
            <span>{{ item.label }}</span>
          </a>
        </DropdownMenuItem>

        <DropdownMenuSub v-else-if="item.type === 'submenu' && item.children?.length">
          <DropdownMenuSubTrigger
            class="gap-2 rounded-none px-2.5 py-1.5 text-[12.5px] text-sidebar-foreground/95 focus:bg-sidebar-accent focus:text-sidebar-accent-foreground"
          >
            <Icon v-if="item.icon" :name="item.icon" class="size-4 text-current" />
            <span>{{ item.label }}</span>
          </DropdownMenuSubTrigger>

          <DropdownMenuSubContent
            class="min-w-[11rem] rounded-lg border-sidebar-border bg-sidebar p-1 text-sidebar-foreground"
          >
            <DropdownMenuItem
              v-for="child in item.children"
              :key="child.id"
              class="flex items-center justify-between rounded-md px-2 py-1.5 text-[12px] text-sidebar-foreground/90 focus:bg-sidebar-accent focus:text-sidebar-accent-foreground"
              :disabled="child.disabled"
              @select="handleLanguageSelect(child.id as 'language-en' | 'language-fil' | 'language-ceb')"
            >
              <span>{{ child.label }}</span>
              <Icon v-if="child.checked" name="lucide:check" class="size-3.5 text-current" />
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuItem
          v-else
          class="gap-2 rounded-none px-2.5 py-1.5 text-[12.5px] text-sidebar-foreground/95 focus:bg-sidebar-accent focus:text-sidebar-accent-foreground"
          @select="handleMenuAction(item.id)"
        >
          <Icon v-if="item.icon" :name="item.icon" class="size-4 text-current" />
          <span>{{ item.label }}</span>
        </DropdownMenuItem>
      </template>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
