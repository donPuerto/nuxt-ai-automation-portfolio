<script setup lang="ts">
import { aiPortfolioContent } from '@@/shared'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const props = defineProps<{
  collapsed?: boolean
}>()

const router = useRouter()
const supabaseConfigured = useSupabaseConfigured()
const settings = supabaseConfigured ? useUserSettings() : null

const initials = computed(() =>
  aiPortfolioContent.sidebarProfileName
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase(),
)

const menuItems = computed(() => aiPortfolioContent.sidebarProfileMenuItems)

const handleMenuAction = async (id: string) => {
  if (id === 'account') {
    await router.push('/settings?section=account')
    return
  }

  if (id === 'notifications') {
    await router.push('/settings?section=notifications')
    return
  }

  if (id === 'logout') {
    if (settings) {
      await settings.signOut('local')
    }
    await router.push('/login')
  }
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <button
        type="button"
        class="w-full bg-transparent text-left text-sidebar-foreground transition hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sidebar-ring"
        :class="collapsed ? 'flex items-center justify-center px-0 py-3' : 'flex items-center gap-2 px-3 py-2.5'"
        :aria-label="aiPortfolioContent.sidebarProfileMenuLabel"
      >
        <div
          class="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-[12px] font-semibold text-sidebar-accent-foreground"
        >
          {{ initials }}
        </div>

        <template v-if="!props.collapsed">
          <div class="min-w-0 flex-1">
            <div class="truncate text-[12.5px] font-semibold leading-none text-sidebar-foreground">
              {{ aiPortfolioContent.sidebarProfileName }}
            </div>
            <div class="mt-1 truncate text-[11px] leading-none text-sidebar-foreground/70">
              {{ aiPortfolioContent.sidebarProfileEmail }}
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
      class="w-[13.5rem] rounded-xl border-sidebar-border bg-sidebar p-0 text-sidebar-foreground shadow-2xl"
    >
      <div class="flex items-center gap-2 px-2.5 py-2.5">
        <div
          class="flex size-9 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-[12px] font-semibold text-sidebar-accent-foreground"
        >
          {{ initials }}
        </div>

        <div class="min-w-0">
          <div class="truncate text-[13px] font-semibold leading-none text-sidebar-foreground">
            {{ aiPortfolioContent.sidebarProfileName }}
          </div>
          <div class="mt-1 truncate text-[11px] leading-none text-sidebar-foreground/70">
            {{ aiPortfolioContent.sidebarProfileEmail }}
          </div>
        </div>
      </div>

      <DropdownMenuSeparator class="my-0 bg-sidebar-border" />

      <template v-for="item in menuItems" :key="item.id">
        <DropdownMenuSeparator
          v-if="item.type === 'separator'"
          class="my-0 bg-sidebar-border"
        />

        <DropdownMenuItem
          v-else
          class="gap-2 rounded-none px-2.5 py-2 text-[13px] text-sidebar-foreground focus:bg-sidebar-accent focus:text-sidebar-accent-foreground"
          @click="handleMenuAction(item.id)"
        >
          <Icon v-if="item.icon" :name="item.icon" class="size-4 text-current" />
          <span>{{ item.label }}</span>
        </DropdownMenuItem>
      </template>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
