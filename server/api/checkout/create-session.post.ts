import Stripe from 'stripe'
import { getSupabaseAdmin } from '../../utils/supabase-admin'

type CreateTemplateCheckoutBody = {
  templateSlug?: string
  buyerEmail?: string
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  if (!config.stripeSecretKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Stripe secret key is not configured.',
    })
  }

  const body = await readBody<CreateTemplateCheckoutBody>(event)

  if (!isNonEmptyString(body.templateSlug) || !isNonEmptyString(body.buyerEmail)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Template slug and buyer email are required.',
    })
  }

  const normalizedEmail = body.buyerEmail.trim().toLowerCase()

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Please provide a valid email address.',
    })
  }

  const supabase = getSupabaseAdmin(event)
  const { data: template, error: templateError } = await supabase
    .from('templates')
    .select('id,slug,name,stripe_price_id,active')
    .eq('slug', body.templateSlug.trim())
    .eq('active', true)
    .maybeSingle()

  if (templateError) {
    throw createError({
      statusCode: 500,
      statusMessage: templateError.message,
    })
  }

  if (!template) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Template is not available for purchase.',
    })
  }

  const stripe = new Stripe(config.stripeSecretKey)
  const origin = config.public.siteUrl?.trim().length
    ? config.public.siteUrl
    : `${getRequestProtocol(event)}://${getRequestHost(event)}`

  const successUrl = new URL('/checkout-success', origin)
  successUrl.searchParams.set('template', template.slug)
  successUrl.searchParams.set('session_id', '{CHECKOUT_SESSION_ID}')

  const cancelUrl = new URL('/checkout-cancelled', origin)
  cancelUrl.searchParams.set('template', template.slug)

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: normalizedEmail,
    allow_promotion_codes: true,
    success_url: successUrl.toString(),
    cancel_url: cancelUrl.toString(),
    line_items: [
      {
        price: template.stripe_price_id,
        quantity: 1,
      },
    ],
    metadata: {
      purchaseType: 'template',
      templateId: template.id,
      templateSlug: template.slug,
      buyerEmail: normalizedEmail,
    },
  })

  if (!session.url) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Stripe checkout URL was not returned.',
    })
  }

  return {
    checkoutUrl: session.url,
    sessionId: session.id,
  }
})
