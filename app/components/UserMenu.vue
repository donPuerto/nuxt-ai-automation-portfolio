<script setup lang="ts">
const props = withDefaults(defineProps<{
  name?: string
  email?: string
}>(), {
  name: 'Don Puerto',
  email: 'm@example.com',
})
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" class="h-8 gap-2 rounded-full px-2">
        <Avatar class="size-6">
          <AvatarFallback>DP</AvatarFallback>
        </Avatar>
        <span class="text-xs">{{ props.name }}</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-52">
      <div class="px-2 py-1.5">
        <p class="text-sm font-medium">{{ props.name }}</p>
        <p class="text-xs text-muted-foreground">{{ props.email }}</p>
      </div>
      <DropdownMenuSeparator />
      <DropdownMenuItem>Settings</DropdownMenuItem>
      <DropdownMenuItem>Billing</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem>Log out</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
