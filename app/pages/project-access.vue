<script setup lang="ts">
import type {
  Appearance,
  Stripe,
  StripeElements,
  StripeExpressCheckoutElement,
  StripePaymentElement,
} from '@stripe/stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { refDebounced } from '@vueuse/core'
import { accessPageDefaults, formatMinorAmount, getCategoryBySlug, getProjectBySlugs, parsePriceLabel, platformBundleOffers } from '@@/shared'

definePageMeta({
  path: '/projects/:category/:slug/access',
})

type CreatePaymentIntentResponse = {
  clientSecret: string
  amount: number
  currency: string
  paymentIntentId: string
}

const route = useRoute()
const colorMode = useColorMode()
const runtimeConfig = useRuntimeConfig()

const project = computed(() =>
  getProjectBySlugs(route.params.category as string, route.params.slug as string),
)

if (!project.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Project not found',
  })
}

const category = computed(() => getCategoryBySlug(project.value!.category))
const accessContent = computed(() => ({
  ...accessPageDefaults,
  ...project.value!.access,
}))
const bundleOffer = computed(() => project.value?.access?.bundleOffer ?? platformBundleOffers[project.value!.primaryPlatform])

const buyerType = ref<'private' | 'company'>('private')
const preferredMethod = ref<'express' | 'card'>('card')
const buyerEmail = ref('')
const buyerFirstName = ref('')
const buyerLastName = ref('')
const buyerCompany = ref('')
const buyerAddress = ref('')
const buyerHouseNumber = ref('')
const buyerZip = ref('')
const buyerCity = ref('')
const buyerCountry = ref('PH')
const sendAsGift = ref(false)
const selectedOfferCodes = ref<string[]>([])

const checkoutError = ref('')
const paymentStatus = ref<'waiting' | 'loading' | 'ready' | 'unavailable' | 'error'>('waiting')
const paymentStatusMessage = ref('Enter your email address to load the secure payment form.')
const intentClientSecret = ref('')
const intentAmount = ref<number | null>(null)
const intentCurrency = ref('usd')
const isSubmitting = ref(false)

const paymentElementRef = useTemplateRef<HTMLDivElement>('paymentElementRef')
const expressCheckoutRef = useTemplateRef<HTMLDivElement>('expressCheckoutRef')

let stripeInstance: Stripe | null = null
let elementsInstance: StripeElements | null = null
let paymentElement: StripePaymentElement | null = null
let expressCheckoutElement: StripeExpressCheckoutElement | null = null

const countryOptions = [
  { value: 'PH', label: 'Philippines' },
  { value: 'US', label: 'United States' },
  { value: 'AU', label: 'Australia' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'CA', label: 'Canada' },
  { value: 'SG', label: 'Singapore' },
] as const

const debouncedBuyerEmail = refDebounced(buyerEmail, 450)

const availableOffers = computed(() => {
  const offers = [
    ...(project.value?.access?.upsells ?? []),
    ...(bundleOffer.value ? [bundleOffer.value] : []),
  ]

  return offers
    .filter(offer => offer.stripePriceId)
    .map(offer => ({
      ...offer,
      code: offer.productCode ?? offer.title,
    }))
})

const bundleOfferCode = computed(() =>
  bundleOffer.value?.productCode ?? bundleOffer.value?.title ?? null,
)

const selectedOffers = computed(() => {
  const selectedCodes = new Set(selectedOfferCodes.value)
  return availableOffers.value.filter(offer => selectedCodes.has(offer.code))
})

const summaryItems = computed(() => [
  {
    key: project.value!.slug,
    title: project.value!.title,
    priceLabel: project.value!.priceLabel,
    summary: project.value!.summary,
  },
  ...selectedOffers.value.map(offer => ({
    key: offer.code,
    title: offer.title,
    priceLabel: offer.priceLabel,
    summary: offer.summary,
  })),
])

const totalLabel = computed(() => {
  if (intentAmount.value !== null) {
    return formatMinorAmount(intentAmount.value, intentCurrency.value)
  }

  const parsedPrices = summaryItems.value
    .map(item => parsePriceLabel(item.priceLabel))
    .filter((price): price is NonNullable<typeof price> => Boolean(price))

  if (!parsedPrices.length) {
    return project.value!.priceLabel
  }

  const total = parsedPrices.reduce((sum, price) => sum + price.amount, 0)
  const firstPrice = parsedPrices.at(0)

  if (!firstPrice) {
    return project.value!.priceLabel
  }

  return formatMinorAmount(total, firstPrice.currency)
})

const hasValidBuyerEmail = computed(() =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(debouncedBuyerEmail.value.trim()),
)

const createAppearance = (): Appearance => ({
  theme: colorMode.value === 'dark' ? 'night' : 'stripe',
  labels: 'floating',
  variables: {
    colorPrimary: colorMode.value === 'dark' ? '#fafafa' : '#09090b',
    colorBackground: colorMode.value === 'dark' ? '#09090b' : '#ffffff',
    colorText: colorMode.value === 'dark' ? '#fafafa' : '#09090b',
    colorDanger: '#ef4444',
    borderRadius: '16px',
    fontFamily: 'Inter, system-ui, sans-serif',
    spacingUnit: '4px',
  },
  rules: {
    '.Input': {
      border: colorMode.value === 'dark' ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(9,9,11,0.12)',
      boxShadow: 'none',
    },
    '.Tab': {
      borderRadius: '999px',
    },
  },
})

const destroyStripeElements = () => {
  expressCheckoutElement?.unmount()
  paymentElement?.unmount()
  expressCheckoutElement = null
  paymentElement = null
  elementsInstance = null
}

const createPaymentIntent = async () => {
  const response = await $fetch<CreatePaymentIntentResponse>('/api/stripe/create-payment-intent', {
    method: 'POST',
    body: {
      categorySlug: project.value!.category,
      projectSlug: project.value!.slug,
      buyerEmail: debouncedBuyerEmail.value.trim(),
      selectedOffers: selectedOfferCodes.value,
    },
  })

  intentClientSecret.value = response.clientSecret
  intentAmount.value = response.amount
  intentCurrency.value = response.currency
}

const buildBillingDetails = () => ({
  name: [buyerFirstName.value, buyerLastName.value].filter(Boolean).join(' ').trim() || undefined,
  email: buyerEmail.value.trim() || undefined,
  address: {
    country: buyerCountry.value,
    city: buyerCity.value || undefined,
    line1: [buyerAddress.value, buyerHouseNumber.value].filter(Boolean).join(', ').trim() || undefined,
    postal_code: buyerZip.value || undefined,
  },
})

const goToSuccessPage = async () => {
  const successUrl = new URL('/checkout-success', window.location.origin)
  successUrl.searchParams.set('category', project.value!.category)
  successUrl.searchParams.set('project', project.value!.slug)

  await navigateTo(successUrl.toString(), { external: true })
}

const confirmStripePayment = async () => {
  if (!stripeInstance || !elementsInstance) {
    checkoutError.value = 'Secure payment fields are not ready yet. Please wait a moment and try again.'
    return
  }

  checkoutError.value = ''
  isSubmitting.value = true

  try {
    const submitResult = await elementsInstance.submit()

    if (submitResult.error) {
      checkoutError.value = submitResult.error.message ?? accessContent.value.checkoutErrorFallback
      return
    }

    const result = await stripeInstance.confirmPayment({
      elements: elementsInstance,
      confirmParams: {
        return_url: `${window.location.origin}/checkout-success?category=${project.value!.category}&project=${project.value!.slug}`,
        payment_method_data: {
          billing_details: buildBillingDetails(),
        },
      },
      redirect: 'if_required',
    })

    if (result.error) {
      checkoutError.value = result.error.message ?? accessContent.value.checkoutErrorFallback
      return
    }

    if (result.paymentIntent?.status === 'succeeded') {
      await goToSuccessPage()
    }
  }
  catch (error) {
    console.error(error)
    checkoutError.value = accessContent.value.checkoutErrorFallback
  }
  finally {
    isSubmitting.value = false
  }
}

const initializeEmbeddedCheckout = async () => {
  if (!import.meta.client) {
    return
  }

  checkoutError.value = ''

  if (!runtimeConfig.public.stripePublishableKey) {
    destroyStripeElements()
    paymentStatus.value = 'unavailable'
    paymentStatusMessage.value = 'Add your Stripe publishable key to load the secure checkout form.'
    return
  }

  if (!hasValidBuyerEmail.value) {
    destroyStripeElements()
    paymentStatus.value = 'waiting'
    paymentStatusMessage.value = 'Enter a valid buyer email to load the secure checkout form.'
    return
  }

  paymentStatus.value = 'loading'
  paymentStatusMessage.value = 'Loading secure payment fields…'

  try {
    await createPaymentIntent()

    if (!stripeInstance) {
      stripeInstance = await loadStripe(runtimeConfig.public.stripePublishableKey)
    }

    if (!stripeInstance) {
      throw new Error('Stripe.js failed to initialize.')
    }

    await nextTick()
    destroyStripeElements()

    elementsInstance = stripeInstance.elements({
      clientSecret: intentClientSecret.value,
      appearance: createAppearance(),
    })

    if (expressCheckoutRef.value) {
      expressCheckoutElement = elementsInstance.create('expressCheckout', {
        layout: {
          maxColumns: 3,
          maxRows: 1,
          overflow: 'auto',
        },
      })

      expressCheckoutElement.mount(expressCheckoutRef.value)
      expressCheckoutElement.on('confirm', async () => {
        preferredMethod.value = 'express'
        await confirmStripePayment()
      })
    }

    if (paymentElementRef.value) {
      paymentElement = elementsInstance.create('payment', {
        layout: 'tabs',
        defaultValues: {
          billingDetails: buildBillingDetails(),
        },
      })

      paymentElement.mount(paymentElementRef.value)
    }

    paymentStatus.value = 'ready'
    paymentStatusMessage.value = 'Secure payment fields are ready.'
  }
  catch (error) {
    console.error(error)
    destroyStripeElements()
    paymentStatus.value = 'error'
    paymentStatusMessage.value = 'We could not load the secure payment form right now.'
    checkoutError.value = accessContent.value.checkoutErrorFallback
  }
}

const toggleOffer = (code: string, checked: boolean) => {
  const nextCodes = new Set(selectedOfferCodes.value)

  if (checked) {
    nextCodes.add(code)
  }
  else {
    nextCodes.delete(code)
  }

  selectedOfferCodes.value = Array.from(nextCodes)
}

const focusPaymentSection = (target: 'express' | 'card') => {
  preferredMethod.value = target

  const element = target === 'express' ? expressCheckoutRef.value : paymentElementRef.value
  element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

const submitSelectedMethod = async () => {
  if (preferredMethod.value === 'express') {
    focusPaymentSection('express')
    checkoutError.value = 'Use the Link or Google Pay buttons in the express checkout section above to complete payment.'
    return
  }

  await confirmStripePayment()
}

watch(
  () => [debouncedBuyerEmail.value, JSON.stringify(selectedOfferCodes.value), colorMode.value],
  async () => {
    await initializeEmbeddedCheckout()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  destroyStripeElements()
})

useSeoMeta({
  title: () => `${project.value?.title ?? 'Project'} Access | Don Puerto`,
  description: () => accessContent.value.subheadline ?? project.value?.summary ?? 'Instant access page',
})
</script>

<template>
  <div class="container py-14 md:py-18">
    <div class="mx-auto max-w-6xl">
      <NuxtLink
        :to="`/projects/${project!.category}/${project!.slug}`"
        class="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <Icon name="lucide:arrow-left" class="size-4" />
        <span>Back to {{ project!.title }}</span>
      </NuxtLink>

      <div class="mt-6 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <form class="space-y-6" @submit.prevent="submitSelectedMethod">
          <div class="space-y-4">
            <div class="flex flex-wrap items-center gap-2">
              <span
                v-for="platform in project!.platforms"
                :key="platform"
                class="rounded-full border border-border/60 bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground"
              >
                {{ platform }}
              </span>
            </div>

            <div>
              <p class="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
                {{ category?.title }}
              </p>
              <h1 class="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
                {{ accessContent.headline }}
              </h1>
              <p class="mt-4 max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
                {{ accessContent.subheadline }}
              </p>
            </div>
          </div>

          <Card class="rounded-3xl border-border/60 bg-card/70 shadow-sm">
            <CardHeader class="space-y-3">
              <CardTitle class="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
                Continue with express checkout
              </CardTitle>
              <CardDescription class="text-sm leading-7 text-muted-foreground md:text-base">
                Use Link or Google Pay when your browser and device support wallet checkout.
              </CardDescription>
            </CardHeader>
            <CardContent class="space-y-4">
              <ClientOnly>
                <div
                  ref="expressCheckoutRef"
                  class="min-h-13 rounded-2xl border border-border/60 bg-background/80 p-3"
                />
                <template #fallback>
                  <div class="flex min-h-13 items-center rounded-2xl border border-border/60 bg-background/80 px-4 text-sm text-muted-foreground">
                    Loading express checkout…
                  </div>
                </template>
              </ClientOnly>

              <p class="text-xs leading-6 text-muted-foreground">
                {{ accessContent.supportNote }}
              </p>
            </CardContent>
          </Card>

          <Card class="rounded-3xl border-border/60 bg-card/70 shadow-sm">
            <CardHeader class="space-y-3">
              <CardTitle class="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
                Continue by adding contact details
              </CardTitle>
              <CardDescription class="text-sm leading-7 text-muted-foreground md:text-base">
                {{ accessContent.contactBody }}
              </CardDescription>
            </CardHeader>
            <CardContent class="space-y-5">
              <div class="space-y-3">
                <Label>Billing type</Label>
                <RadioGroup v-model="buyerType" class="grid gap-3 sm:grid-cols-2">
                  <Label class="cursor-pointer rounded-2xl border border-border/60 bg-background/80 p-4">
                    <RadioGroupItem value="private" />
                    <span>Private person</span>
                  </Label>
                  <Label class="cursor-pointer rounded-2xl border border-border/60 bg-background/80 p-4">
                    <RadioGroupItem value="company" />
                    <span>Company</span>
                  </Label>
                </RadioGroup>
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <div class="space-y-2">
                  <Label for="buyer-first-name">First name</Label>
                  <Input id="buyer-first-name" v-model="buyerFirstName" autocomplete="given-name" placeholder="First name" />
                </div>
                <div class="space-y-2">
                  <Label for="buyer-last-name">Last name</Label>
                  <Input id="buyer-last-name" v-model="buyerLastName" autocomplete="family-name" placeholder="Last name" />
                </div>
              </div>

              <div v-if="buyerType === 'company'" class="space-y-2">
                <Label for="buyer-company">Company</Label>
                <Input id="buyer-company" v-model="buyerCompany" autocomplete="organization" placeholder="Company name" />
              </div>

              <div class="space-y-2">
                <Label for="buyer-email">{{ accessContent.buyerEmailLabel }}</Label>
                <Input
                  id="buyer-email"
                  v-model="buyerEmail"
                  type="email"
                  autocomplete="email"
                  :placeholder="accessContent.buyerEmailPlaceholder"
                />
                <p class="text-xs leading-6 text-muted-foreground">
                  {{ accessContent.buyerEmailHelp }}
                </p>
              </div>

              <div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_160px]">
                <div class="space-y-2">
                  <Label for="buyer-address">Address</Label>
                  <Input id="buyer-address" v-model="buyerAddress" autocomplete="address-line1" placeholder="Street address" />
                </div>
                <div class="space-y-2">
                  <Label for="buyer-house-number">House No</Label>
                  <Input id="buyer-house-number" v-model="buyerHouseNumber" autocomplete="address-line2" placeholder="Unit / house no" />
                </div>
              </div>

              <div class="grid gap-4 sm:grid-cols-[120px_minmax(0,1fr)]">
                <div class="space-y-2">
                  <Label for="buyer-zip">ZIP</Label>
                  <Input id="buyer-zip" v-model="buyerZip" autocomplete="postal-code" placeholder="ZIP" />
                </div>
                <div class="space-y-2">
                  <Label for="buyer-city">City</Label>
                  <Input id="buyer-city" v-model="buyerCity" autocomplete="address-level2" placeholder="City" />
                </div>
              </div>

              <div class="space-y-2">
                <Label for="buyer-country">Country</Label>
                <Select v-model="buyerCountry">
                  <SelectTrigger id="buyer-country" class="w-full">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="country in countryOptions"
                      :key="country.value"
                      :value="country.value"
                    >
                      {{ country.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Label class="cursor-pointer items-start gap-3 rounded-2xl border border-border/60 bg-background/80 p-4">
                <Checkbox :checked="sendAsGift" @update:checked="sendAsGift = $event === true" />
                <span class="space-y-1">
                  <span class="block text-sm font-medium text-foreground">Send as gift / different delivery address</span>
                  <span class="block text-xs leading-6 text-muted-foreground">Keep this off unless the workflow links should be sent somewhere else after purchase.</span>
                </span>
              </Label>
            </CardContent>
          </Card>

          <Card class="rounded-3xl border-border/60 bg-card/70 shadow-sm">
            <CardHeader class="space-y-3">
              <CardTitle class="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
                Credit card details
              </CardTitle>
              <CardDescription class="text-sm leading-7 text-muted-foreground md:text-base">
                Secure card fields are provided by Stripe and stay inside their PCI-compliant payment element.
              </CardDescription>
            </CardHeader>
            <CardContent class="space-y-4">
              <ClientOnly>
                <div
                  ref="paymentElementRef"
                  class="min-h-44 rounded-2xl border border-border/60 bg-background/80 p-3"
                />
                <template #fallback>
                  <div class="flex min-h-44 items-center justify-center rounded-2xl border border-border/60 bg-background/80 px-4 text-sm text-muted-foreground">
                    Loading secure card form…
                  </div>
                </template>
              </ClientOnly>

              <Alert v-if="paymentStatus !== 'ready'" class="rounded-2xl border-border/60 bg-background/80">
                <Icon name="lucide:shield-check" class="size-4" />
                <AlertTitle>
                  {{ paymentStatus === 'loading' ? 'Loading payment form' : 'Payment form status' }}
                </AlertTitle>
                <AlertDescription>
                  {{ paymentStatusMessage }}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </form>

        <div class="space-y-6">
          <Card class="rounded-3xl border-border/60 bg-card/80 shadow-sm">
            <CardHeader class="space-y-3">
              <CardTitle class="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
                Select payment method
              </CardTitle>
              <CardDescription class="text-sm leading-7 text-muted-foreground md:text-base">
                Choose how you want to finish checkout. Link and Google Pay use the express buttons on the left. Credit card uses the embedded card form below the buyer details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup v-model="preferredMethod" class="grid gap-4 sm:grid-cols-2">
                <Label class="cursor-pointer rounded-2xl border border-border/60 bg-background/80 p-4 transition-colors hover:border-primary/40">
                  <RadioGroupItem value="express" />
                  <span class="space-y-1">
                    <span class="block text-sm font-medium text-foreground">Google Pay / Link</span>
                    <span class="block text-xs leading-6 text-muted-foreground">Use express checkout for the fastest wallet or Link flow.</span>
                  </span>
                </Label>
                <Label class="cursor-pointer rounded-2xl border border-border/60 bg-background/80 p-4 transition-colors hover:border-primary/40">
                  <RadioGroupItem value="card" />
                  <span class="space-y-1">
                    <span class="block text-sm font-medium text-foreground">Credit card</span>
                    <span class="block text-xs leading-6 text-muted-foreground">Use the embedded Stripe card form for standard card payments.</span>
                  </span>
                </Label>
              </RadioGroup>

              <div class="mt-4 flex gap-3">
                <Button type="button" variant="outline" class="rounded-full" @click="focusPaymentSection('express')">
                  Focus express checkout
                </Button>
                <Button type="button" variant="outline" class="rounded-full" @click="focusPaymentSection('card')">
                  Focus card form
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card class="rounded-3xl border-border/60 bg-card/80 shadow-sm">
            <CardHeader class="space-y-3">
              <CardTitle class="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
                {{ accessContent.summaryLabel }}
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div
                v-for="item in summaryItems"
                :key="item.key"
                class="flex items-start justify-between gap-4 rounded-2xl border border-border/60 bg-background/70 p-4"
              >
                <div>
                  <p class="text-sm font-semibold text-foreground">
                    {{ item.title }}
                  </p>
                  <p class="mt-1 text-xs leading-6 text-muted-foreground">
                    {{ item.summary }}
                  </p>
                </div>
                <p class="text-sm font-semibold text-foreground">
                  {{ item.priceLabel }}
                </p>
              </div>

              <div class="rounded-2xl border border-border/60 bg-background/70 p-4">
                <div class="flex items-start justify-between gap-4">
                  <div>
                    <p class="text-sm font-semibold text-foreground">
                      Due today
                    </p>
                    <p class="mt-1 text-xs leading-6 text-muted-foreground">
                      One-time payment. Workflow links are delivered by email after payment.
                    </p>
                  </div>
                  <p class="text-2xl font-semibold tracking-tight text-foreground">
                    {{ totalLabel }}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                size="lg"
                class="w-full rounded-full"
                :disabled="isSubmitting || paymentStatus !== 'ready'"
                @click="submitSelectedMethod"
              >
                {{ isSubmitting ? 'Processing…' : preferredMethod === 'card' ? 'Pay with card' : 'Use express checkout above' }}
              </Button>

              <p v-if="checkoutError" class="text-sm text-destructive">
                {{ checkoutError }}
              </p>

              <p class="text-xs leading-6 text-muted-foreground">
                {{ accessContent.guarantee }}
              </p>
            </CardContent>
          </Card>

          <div v-if="project!.access?.upsells?.length || (bundleOffer && bundleOffer.stripePriceId)" class="space-y-4">
            <p class="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              Optional add-ons
            </p>

            <Label
              v-for="offer in availableOffers"
              :key="offer.code"
              class="cursor-pointer items-start gap-4 rounded-3xl border border-border/60 bg-card/70 p-5 shadow-sm transition-colors hover:border-primary/40"
            >
              <Checkbox
                :checked="selectedOfferCodes.includes(offer.code)"
                @update:checked="toggleOffer(offer.code, $event === true)"
              />
              <span class="space-y-2">
                <span class="flex flex-wrap items-center gap-3">
                  <span class="text-base font-semibold text-foreground">{{ offer.title }}</span>
                  <span class="text-sm font-semibold text-primary">{{ offer.priceLabel }}</span>
                  <span v-if="offer.originalPriceLabel" class="text-sm text-muted-foreground line-through">{{ offer.originalPriceLabel }}</span>
                </span>
                <span class="block text-sm leading-7 text-muted-foreground">
                  {{ offer.summary }}
                </span>
                <span v-if="offer.code === bundleOfferCode" class="block text-xs font-medium uppercase tracking-[0.18em] text-primary">
                  Bundle option
                </span>
                <ul v-if="offer.bullets?.length" class="space-y-2">
                  <li
                    v-for="bullet in offer.bullets"
                    :key="bullet"
                    class="flex gap-3 text-sm leading-6 text-muted-foreground"
                  >
                    <Icon name="lucide:check" class="mt-1 size-4 shrink-0 text-primary" />
                    <span>{{ bullet }}</span>
                  </li>
                </ul>
              </span>
            </Label>
          </div>

          <Card class="rounded-3xl border-border/60 bg-card/70 shadow-sm">
            <CardHeader class="space-y-3">
              <CardTitle class="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
                Need this customized?
              </CardTitle>
              <CardDescription class="text-sm leading-7 text-muted-foreground md:text-base">
                If you want this project adapted to your CRM, processes, or client workflow, we can scope a custom version together.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DiscoveryCallButton
                label="Start a discovery call"
                variant="outline"
                size="lg"
                button-class="w-full rounded-full"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>
