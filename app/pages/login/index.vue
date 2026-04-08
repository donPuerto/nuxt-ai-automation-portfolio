<script setup lang="ts">
definePageMeta({
  layout: 'auth',
})

useSeoMeta({
  title: 'Login | Don Puerto',
  description: 'Sign in to access your portfolio workspace, saved prompts, and private tools.',
})
</script>

<template>
  <div class="flex min-h-svh items-center justify-center bg-background px-6 py-10 md:px-10">
    <div class="w-full max-w-sm md:max-w-5xl">
      <LoginForm />
    </div>
  </div>
</template>
