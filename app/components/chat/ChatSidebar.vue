<script setup lang="ts">
import type { AiPortfolioHistoryEntry } from '@/composables/useAiPortfolio'
import type { AiPortfolioNavIntent } from '@@/shared'
import { aiPortfolioContent } from '@@/shared'
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import ChatSidebarFooter from './ChatSidebarFooter.vue'

const props = defineProps<{
  historyEntries: AiPortfolioHistoryEntry[]
  activePrompt?: string
  activeIntent?: AiPortfolioNavIntent | 'prompt' | ''
}>()

const emit = defineEmits<{
  newChat: []
  navigate: [intent: AiPortfolioNavIntent]
  replay: [entry: AiPortfolioHistoryEntry]
}>()

const activeHistoryLabel = computed(() => props.activePrompt?.trim() || '')
const { state } = useSidebar()
const collapsed = computed(() => state.value === 'collapsed')
</script>

<template>
  <SidebarContent class="gap-0 overflow-x-hidden bg-sidebar text-sidebar-foreground">
    <SidebarGroup class="border-b border-sidebar-border px-1 pt-2 pb-1">
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="default"
            class="h-8 rounded-lg border-0 bg-transparent px-2 text-[13px] font-medium text-sidebar-foreground/90 shadow-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-lg group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:text-sidebar-foreground"
            :tooltip="aiPortfolioContent.sidebarNewChatLabel"
            @click="emit('newChat')"
          >
            <Icon name="lucide:pen-square" class="size-3.5 shrink-0 text-current group-data-[collapsible=icon]:size-4" />
            <span class="group-data-[collapsible=icon]:hidden">{{ aiPortfolioContent.sidebarNewChatLabel }}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>

    <SidebarGroup class="px-1 pt-2 pb-1">
      <SidebarGroupLabel
        class="px-1.5 text-[0.66rem] font-medium tracking-[0.16em] text-sidebar-foreground/65 uppercase group-data-[collapsible=icon]:hidden"
      >
        {{ aiPortfolioContent.sidebarNavigationLabel }}
      </SidebarGroupLabel>
      <SidebarMenu class="mt-1 gap-0.5">
        <SidebarMenuItem
          v-for="item in aiPortfolioContent.sidebarNavItems"
          :key="item.id"
        >
          <SidebarMenuButton
            :tooltip="item.label"
            class="h-8 rounded-lg px-2 text-[13px] font-normal text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:text-sidebar-foreground"
            :data-active="props.activeIntent === item.id"
            @click="emit('navigate', item.id)"
          >
            <Icon :name="item.icon" class="size-3.5 shrink-0 text-current group-data-[collapsible=icon]:size-4" />
            <span class="group-data-[collapsible=icon]:hidden">{{ item.label }}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>

    <SidebarGroup class="px-1 pt-2.5 pb-1.5">
      <SidebarGroupLabel
        class="px-1.5 text-[0.66rem] font-medium tracking-[0.16em] text-sidebar-foreground/65 uppercase group-data-[collapsible=icon]:hidden"
      >
        {{ aiPortfolioContent.sidebarHistoryLabel }}
      </SidebarGroupLabel>

      <SidebarMenu v-if="historyEntries.length" class="mt-1 gap-0.5">
        <SidebarMenuItem
          v-for="entry in historyEntries"
          :key="entry.id"
        >
          <SidebarMenuButton
            :tooltip="entry.label"
            class="h-8 rounded-lg px-2 text-[13px] font-normal text-sidebar-foreground/90 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:text-sidebar-foreground"
            :data-active="entry.label === activeHistoryLabel"
            @click="emit('replay', entry)"
          >
            <Icon :name="entry.icon" class="size-3.5 shrink-0 text-current group-data-[collapsible=icon]:size-4" />
            <span class="group-data-[collapsible=icon]:hidden">{{ entry.label }}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>

      <div
        v-else
        class="px-2 py-2 text-[12px] text-sidebar-foreground/65 group-data-[collapsible=icon]:hidden"
      >
        {{ aiPortfolioContent.sidebarEmptyLabel }}
      </div>
    </SidebarGroup>
  </SidebarContent>

  <SidebarFooter class="border-t border-sidebar-border bg-sidebar p-0">
    <ChatSidebarFooter :collapsed="collapsed" />
  </SidebarFooter>
</template>
