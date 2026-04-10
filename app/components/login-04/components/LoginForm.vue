<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { toTypedSchema } from '@vee-validate/zod'
import { useField, useForm } from 'vee-validate'
import { z } from 'zod'
import { cn } from "@/lib/utils"
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()

const router = useRouter()
const supabaseConfigured = useSupabaseConfigured()
const supabase = supabaseConfigured ? useSupabaseClient() : null

const loading = ref(false)
const errorMessage = ref('')

const oauthLoading = ref<'github' | 'google' | null>(null)

const loginSchema = toTypedSchema(z.object({
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
}))

const { handleSubmit, errors } = useForm({
  validationSchema: loginSchema,
  initialValues: {
    email: '',
    password: '',
  },
})

const { value: email } = useField<string>('email')
const { value: password } = useField<string>('password')

const getOAuthRedirectTo = () => {
  if (!import.meta.client) {
    return undefined
  }

  return `${window.location.origin}/`
}

const signInWithOAuth = async (provider: 'github' | 'google') => {
  if (!supabase) {
    errorMessage.value = 'Supabase is not configured in this app.'
    return
  }

  if (loading.value || oauthLoading.value) {
    return
  }

  errorMessage.value = ''
  oauthLoading.value = provider

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: getOAuthRedirectTo(),
    },
  })

  if (error) {
    errorMessage.value = error.message || `Unable to continue with ${provider}.`
    oauthLoading.value = null
  }
}

const onSubmit = handleSubmit(async (values) => {
  if (loading.value) {
    return
  }

  errorMessage.value = ''
  loading.value = true

  try {
    const payload = await $fetch<{
      session: {
        access_token: string
        refresh_token: string
      }
    }>('/api/auth/login', {
      method: 'POST',
      body: {
        email: values.email,
        password: values.password,
      },
    })

    if (!supabase) {
      throw new Error('Supabase client is not configured in this app.')
    }

    const { error } = await supabase.auth.setSession({
      access_token: payload.session.access_token,
      refresh_token: payload.session.refresh_token,
    })

    if (error) {
      throw new Error(error.message)
    }

    await router.push('/')
  }
  catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed. Please try again.'
    errorMessage.value = message
  }
  finally {
    loading.value = false
  }
})

onMounted(async () => {
  if (!supabase) {
    return
  }

  const { data } = await supabase.auth.getSession()
  if (data.session) {
    await router.push('/')
  }
})
</script>

<template>
  <div :class="cn('flex flex-col gap-6', props.class)">
    <Card class="overflow-hidden border-[#4a433d] bg-[#2b2724] p-0 text-[#f0deca] shadow-xl">
      <CardContent class="grid p-0 md:grid-cols-2">
        <form class="px-6 pt-4 pb-6 md:px-8 md:pt-5 md:pb-8" @submit.prevent="onSubmit">
          <FieldGroup class="gap-5 md:gap-6">
            <div class="flex flex-col items-center gap-1.5 text-center">
              <h1 class="text-2xl font-semibold text-[#fff4e6]">
                Welcome back
              </h1>
              <p class="text-balance text-sm text-[#d3c0ab]">
                Sign in to access your workspace, saved prompts, and portfolio tools.
              </p>
            </div>
            <Field class="gap-1.5">
              <FieldLabel for="email" class="text-[#f0deca]">
                Email
              </FieldLabel>
              <Input
                id="email"
                v-model="email"
                type="email"
                placeholder="you@company.com"
                required
                class="border-[#4a433d] bg-[#221f1d] text-[#fff4e6] placeholder:text-[#8f857a]"
              />
              <FieldDescription v-if="errors.email" class="text-red-300">
                {{ errors.email }}
              </FieldDescription>
            </Field>
            <Field class="gap-1.5">
              <div class="flex items-center">
                <FieldLabel for="password" class="text-[#f0deca]">
                  Password
                </FieldLabel>
                <NuxtLink
                  to="/contact"
                  class="ml-auto text-sm text-[#d3c0ab] underline-offset-2 hover:text-[#fff4e6] hover:underline"
                >
                  Forgot your password?
                </NuxtLink>
              </div>
              <Input
                id="password"
                v-model="password"
                type="password"
                placeholder="Enter your password"
                required
                class="border-[#4a433d] bg-[#221f1d] text-[#fff4e6] placeholder:text-[#8f857a]"
              />
              <FieldDescription v-if="errors.password" class="text-red-300">
                {{ errors.password }}
              </FieldDescription>
            </Field>
            <Field>
              <Button type="submit" :disabled="loading" class="w-full bg-[#b87449] text-white hover:bg-[#c6845a] disabled:opacity-60">
                {{ loading ? 'Logging in...' : 'Login' }}
              </Button>
            </Field>
            <Field v-if="errorMessage">
              <FieldDescription class="text-center text-red-300">
                {{ errorMessage }}
              </FieldDescription>
            </Field>
            <FieldSeparator class="*:data-[slot=field-separator-content]:bg-[#2b2724] *:data-[slot=field-separator-content]:text-[#8f857a]">
              Or continue with
            </FieldSeparator>
            <Field class="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                type="button"
                :disabled="Boolean(oauthLoading)"
                class="border-[#4a433d] bg-[#221f1d] text-[#f0deca] hover:bg-[#2d2926] hover:text-[#fff4e6] disabled:opacity-60"
                @click="signInWithOAuth('github')"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path
                    d="M12 0C5.372 0 0 5.372 0 12c0 5.302 3.438 9.8 8.205 11.387.6.11.82-.262.82-.582 0-.287-.01-1.047-.016-2.055-3.338.726-4.042-1.61-4.042-1.61-.546-1.386-1.333-1.754-1.333-1.754-1.09-.745.082-.73.082-.73 1.204.085 1.838 1.236 1.838 1.236 1.07 1.835 2.807 1.304 3.492.997.108-.776.418-1.304.762-1.604-2.665-.304-5.466-1.332-5.466-5.93 0-1.31.468-2.38 1.236-3.22-.124-.303-.536-1.527.117-3.182 0 0 1.008-.322 3.3 1.23a11.52 11.52 0 0 1 3.004-.404c1.02.005 2.048.138 3.005.404 2.29-1.552 3.296-1.23 3.296-1.23.655 1.655.243 2.88.12 3.182.77.84 1.235 1.91 1.235 3.22 0 4.61-2.804 5.624-5.475 5.922.43.37.814 1.103.814 2.222 0 1.604-.014 2.898-.014 3.293 0 .322.216.697.825.58C20.565 21.796 24 17.3 24 12c0-6.628-5.373-12-12-12z"
                    fill="currentColor"
                  />
                </svg>
                <span class="sr-only">Login with GitHub</span>
              </Button>
              <Button
                variant="outline"
                type="button"
                :disabled="Boolean(oauthLoading)"
                class="border-[#4a433d] bg-[#221f1d] text-[#f0deca] hover:bg-[#2d2926] hover:text-[#fff4e6] disabled:opacity-60"
                @click="signInWithOAuth('google')"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                    fill="currentColor"
                  />
                </svg>
                <span class="sr-only">Login with Google</span>
              </Button>
            </Field>
            <FieldDescription class="text-center text-[#b7a693]">
              Need access?
              <NuxtLink to="/contact" class="text-[#f0deca] underline-offset-2 hover:text-[#fff4e6] hover:underline">
                Request an invite
              </NuxtLink>
            </FieldDescription>
          </FieldGroup>
        </form>
        <div class="relative hidden overflow-hidden border-l border-[#4a433d] bg-[#221f1d] md:block">
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,#5f4c3f_0%,transparent_45%),linear-gradient(180deg,#2c2825_0%,#1f1c1a_100%)]" />
          <div class="relative flex h-full flex-col justify-between p-8 text-[#efdcc5]">
            <div class="space-y-3">
              <div class="text-[11px] font-medium tracking-[0.2em] text-[#8f857a] uppercase">
                Portfolio Access
              </div>
              <div class="max-w-xs text-3xl leading-tight" style="font-family: var(--font-serif);">
                Keep your automation workspace in sync.
              </div>
            </div>

            <div class="space-y-3 text-sm text-[#d3c0ab]">
              <p>Save recent prompts, continue project conversations, and unlock private portfolio tools.</p>
              <ul class="space-y-2">
                <li class="flex items-center gap-2">
                  <Icon name="lucide:check" class="size-4 text-[#c6845a]" />
                  Saved conversations
                </li>
                <li class="flex items-center gap-2">
                  <Icon name="lucide:check" class="size-4 text-[#c6845a]" />
                  Portfolio workspace sync
                </li>
                <li class="flex items-center gap-2">
                  <Icon name="lucide:check" class="size-4 text-[#c6845a]" />
                  Private access links
                </li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    <FieldDescription class="px-6 text-center text-[#8f857a]">
      By continuing, you agree to the portfolio access terms and privacy policy.
    </FieldDescription>
  </div>
</template>
