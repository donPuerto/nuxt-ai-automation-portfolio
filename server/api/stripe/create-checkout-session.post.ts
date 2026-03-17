import Stripe from 'stripe'
import { getProjectBySlugs, platformBundleOffers } from '@@/shared'

type CreateCheckoutSessionBody = {
  categorySlug?: string
  projectSlug?: string
  buyerEmail?: string
  selectedOffers?: string[]
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

  const body = await readBody<CreateCheckoutSessionBody>(event)

  if (!isNonEmptyString(body.categorySlug) || !isNonEmptyString(body.projectSlug) || !isNonEmptyString(body.buyerEmail)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Project, category, and buyer email are required.',
    })
  }

  const project = getProjectBySlugs(body.categorySlug, body.projectSlug)

  if (!project?.checkout?.stripePriceId) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Project checkout is not configured.',
    })
  }

  const upsellPool = [
    ...(project.access?.upsells ?? []),
    ...(project.access?.bundleOffer ? [project.access.bundleOffer] : []),
    ...(platformBundleOffers[project.primaryPlatform] ? [platformBundleOffers[project.primaryPlatform]] : []),
  ]

  const selectedOffers = (body.selectedOffers ?? [])
    .map(code => upsellPool.find(offer =>
      offer.stripePriceId && (offer.productCode === code || offer.title === code),
    ))
    .filter((offer): offer is NonNullable<typeof offer> => Boolean(offer))

  const stripe = new Stripe(config.stripeSecretKey)
  const origin = `${getRequestProtocol(event)}://${getRequestHost(event)}`
  const successUrl = new URL('/checkout-success', origin)
  successUrl.searchParams.set('category', project.category)
  successUrl.searchParams.set('project', project.slug)
  successUrl.searchParams.set('session_id', '{CHECKOUT_SESSION_ID}')

  const cancelUrl = new URL('/checkout-cancelled', origin)
  cancelUrl.searchParams.set('category', project.category)
  cancelUrl.searchParams.set('project', project.slug)

  const session = await stripe.checkout.sessions.create({
    mode: project.checkout.mode ?? 'payment',
    customer_email: body.buyerEmail.trim(),
    allow_promotion_codes: project.checkout.allowPromotionCodes ?? true,
    success_url: successUrl.toString(),
    cancel_url: cancelUrl.toString(),
    line_items: [
      {
        price: project.checkout.stripePriceId,
        quantity: 1,
      },
      ...selectedOffers.map(offer => ({
        price: offer.stripePriceId!,
        quantity: 1,
      })),
    ],
    metadata: {
      projectSlug: project.slug,
      categorySlug: project.category,
      productCode: project.checkout.productCode,
      n8nFulfillmentKey: project.checkout.n8nFulfillmentKey ?? project.checkout.productCode,
      selectedOffers: selectedOffers.map(offer => offer.productCode ?? offer.title).join(','),
      buyerEmail: body.buyerEmail.trim(),
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
  }
})
