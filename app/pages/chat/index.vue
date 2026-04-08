<script setup lang="ts">
import { homePageCopy } from '@@/shared'

useSeoMeta({
  title: `${homePageCopy.metaTitle} | Don Puerto`,
  description: homePageCopy.metaDescription,
})
</script>

<template>
  <div>
    <ChatShell />
  </div>
</template>
