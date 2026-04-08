<script setup lang="ts">
const model = defineModel<string>('model', { default: 'local-portfolio-agent' })
</script>

<template>
  <header class="flex items-center justify-between border-b border-border/60 px-3 py-2">
    <div class="flex items-center gap-3">
      <BrandLogo />
      <ModelSelect v-model="model" />
    </div>
    <div class="flex items-center gap-2">
      <ThemeSelector />
      <UserMenu />
    </div>
  </header>
</template>
