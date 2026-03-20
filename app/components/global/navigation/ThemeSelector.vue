<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        size="icon"
        class="rounded-full border-0 bg-transparent text-foreground/80 shadow-none hover:bg-white/[0.04] hover:text-foreground dark:hover:bg-white/[0.05]"
      >
        <Icon name="lucide:palette" class="size-5" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-auto p-0">
      <ThemeCustomizer />
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang="ts">
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
</script>
