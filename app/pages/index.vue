<script setup lang="ts">
import { homePageCopy } from '@@/shared'

useSeoMeta({
  title: `${homePageCopy.metaTitle} | Don Puerto`,
  description: homePageCopy.metaDescription,
})

definePageMeta({
  layout: 'workspace',
  workspaceMode: 'prompt',
})
</script>

<template>
  <div />
</template>
