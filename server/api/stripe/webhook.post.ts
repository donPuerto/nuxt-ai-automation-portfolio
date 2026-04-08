import Stripe from 'stripe'
import type { H3Event } from 'h3'
import { getSupabaseAdmin } from '../../utils/supabase-admin'

type StripeLineItemWithPrice = Stripe.LineItem & {
  price?: Stripe.Price | null
}

const handleTemplateCheckoutCompleted = async (
  event: H3Event,
  stripe: Stripe,
  checkoutSession: Stripe.Checkout.Session,
) => {
  const config = useRuntimeConfig(event)
  const templateId = checkoutSession.metadata?.templateId
  const templateSlug = checkoutSession.metadata?.templateSlug
  const buyerEmail = checkoutSession.customer_details?.email
    ?? checkoutSession.customer_email
    ?? checkoutSession.metadata?.buyerEmail
    ?? null

  if (!templateId || !templateSlug || !buyerEmail) {
    return {
      received: true,
      forwarded: false,
      ignored: true,
      reason: 'Missing template metadata or buyer email.',
      type: 'checkout.session.completed',
    }
  }

  const supabase = getSupabaseAdmin(event)
  const normalizedEmail = buyerEmail.trim().toLowerCase()

  const lineItems = await stripe.checkout.sessions.listLineItems(checkoutSession.id, {
    limit: 10,
    expand: ['data.price'],
  })

  const matchedLineItem = (lineItems.data as StripeLineItemWithPrice[])[0]

  const unitAmount = matchedLineItem?.amount_subtotal ?? checkoutSession.amount_subtotal ?? 0
  const quantity = matchedLineItem?.quantity ?? 1
  const subtotalAmount = checkoutSession.amount_subtotal ?? unitAmount * quantity
  const totalAmount = checkoutSession.amount_total ?? subtotalAmount

  const { data: orderRow, error: orderError } = await supabase
    .from('orders')
    .upsert(
      {
        stripe_checkout_session_id: checkoutSession.id,
        stripe_payment_intent_id: typeof checkoutSession.payment_intent === 'string'
          ? checkoutSession.payment_intent
          : checkoutSession.payment_intent?.id ?? null,
        buyer_email: normalizedEmail,
        status: checkoutSession.payment_status ?? 'paid',
        currency: checkoutSession.currency ?? 'usd',
        subtotal_amount: subtotalAmount,
        total_amount: totalAmount,
      },
      { onConflict: 'stripe_checkout_session_id' },
    )
    .select('id')
    .single()

  if (orderError || !orderRow) {
    throw createError({
      statusCode: 500,
      statusMessage: orderError?.message ?? 'Unable to create checkout order.',
    })
  }

  const { error: orderItemError } = await supabase
    .from('order_items')
    .upsert(
      {
        order_id: orderRow.id,
        template_id: templateId,
        unit_amount: unitAmount,
        quantity,
      },
      { onConflict: 'order_id,template_id' },
    )

  if (orderItemError) {
    throw createError({
      statusCode: 500,
      statusMessage: orderItemError.message,
    })
  }

  const { data: accessRow, error: accessError } = await supabase
    .from('template_access')
    .upsert(
      {
        order_id: orderRow.id,
        template_id: templateId,
        buyer_email: normalizedEmail,
      },
      { onConflict: 'order_id,template_id' },
    )
    .select('access_token')
    .single()

  if (accessError || !accessRow) {
    throw createError({
      statusCode: 500,
      statusMessage: accessError?.message ?? 'Unable to grant template access.',
    })
  }

  const baseUrl = config.public.siteUrl?.trim().length
    ? config.public.siteUrl
    : `${getRequestProtocol(event)}://${getRequestHost(event)}`

  const accessUrl = new URL('/project-access', baseUrl)
  accessUrl.searchParams.set('token', accessRow.access_token)
  accessUrl.searchParams.set('template', templateSlug)

  if (config.n8nFulfillmentWebhookUrl) {
    await $fetch(config.n8nFulfillmentWebhookUrl, {
      method: 'POST',
      headers: config.n8nFulfillmentWebhookToken
        ? {
            Authorization: `Bearer ${config.n8nFulfillmentWebhookToken}`,
          }
        : undefined,
      body: {
        type: 'template_checkout_completed',
        eventId: checkoutSession.id,
        buyerEmail: normalizedEmail,
        templateId,
        templateSlug,
        accessToken: accessRow.access_token,
        accessUrl: accessUrl.toString(),
      },
    })
  }

  return {
    received: true,
    forwarded: Boolean(config.n8nFulfillmentWebhookUrl),
    type: 'checkout.session.completed',
    accessUrl: accessUrl.toString(),
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  if (!config.stripeSecretKey || !config.stripeWebhookSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Stripe webhook configuration is missing.',
    })
  }

  const signature = getHeader(event, 'stripe-signature')

  if (!signature) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing Stripe signature header.',
    })
  }

  const rawBody = await readRawBody(event, false)

  if (!rawBody) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing webhook payload.',
    })
  }

  const stripe = new Stripe(config.stripeSecretKey)

  let stripeEvent: Stripe.Event

  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, config.stripeWebhookSecret)
  }
  catch (error) {
    console.error('Stripe webhook signature verification failed', error)
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid Stripe signature.',
    })
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const checkoutSession = stripeEvent.data.object as Stripe.Checkout.Session

    if (checkoutSession.metadata?.purchaseType === 'template') {
      return await handleTemplateCheckoutCompleted(event, stripe, checkoutSession)
    }

    return {
      received: true,
      forwarded: false,
      ignored: true,
      type: stripeEvent.type,
    }
  }

  if (stripeEvent.type !== 'payment_intent.succeeded') {
    return {
      received: true,
      forwarded: false,
      ignored: true,
      type: stripeEvent.type,
    }
  }

  const paymentIntent = stripeEvent.data.object as Stripe.PaymentIntent
  const billingEmail = paymentIntent.latest_charge && typeof paymentIntent.latest_charge !== 'string'
    ? paymentIntent.latest_charge.billing_details?.email
    : null
  const payload = {
    type: stripeEvent.type,
    eventId: stripeEvent.id,
    paymentIntentId: paymentIntent.id,
    projectSlug: paymentIntent.metadata?.projectSlug ?? '',
    categorySlug: paymentIntent.metadata?.categorySlug ?? '',
    productCode: paymentIntent.metadata?.productCode ?? '',
    n8nFulfillmentKey: paymentIntent.metadata?.n8nFulfillmentKey ?? '',
    buyerEmail: paymentIntent.receipt_email ?? billingEmail ?? paymentIntent.metadata?.buyerEmail ?? '',
    selectedOffers: paymentIntent.metadata?.selectedOffers
      ? paymentIntent.metadata.selectedOffers.split(',').filter(Boolean)
      : [],
    amountTotal: paymentIntent.amount_received ?? paymentIntent.amount ?? null,
    currency: paymentIntent.currency ?? null,
    paymentStatus: paymentIntent.status,
  }

  if (!config.n8nFulfillmentWebhookUrl) {
    return {
      received: true,
      forwarded: false,
      payload,
    }
  }

  await $fetch(config.n8nFulfillmentWebhookUrl, {
    method: 'POST',
    headers: config.n8nFulfillmentWebhookToken
      ? {
          Authorization: `Bearer ${config.n8nFulfillmentWebhookToken}`,
        }
      : undefined,
    body: payload,
  })

  return {
    received: true,
    forwarded: true,
  }
})
