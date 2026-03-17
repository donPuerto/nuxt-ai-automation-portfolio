import Stripe from 'stripe'

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
