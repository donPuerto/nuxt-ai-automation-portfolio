import Stripe from 'stripe'
import { getProjectBySlugs, parsePriceLabel, platformBundleOffers } from '@@/shared'

type CreatePaymentIntentBody = {
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

  const body = await readBody<CreatePaymentIntentBody>(event)

  if (!isNonEmptyString(body.categorySlug) || !isNonEmptyString(body.projectSlug)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Project and category are required.',
    })
  }

  const project = getProjectBySlugs(body.categorySlug, body.projectSlug)

  if (!project?.checkout) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Project checkout is not configured.',
    })
  }

  const basePrice = parsePriceLabel(project.priceLabel)

  if (!basePrice) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Project price label could not be parsed into a Stripe amount.',
    })
  }

  const upsellPool = [
    ...(project.access?.upsells ?? []),
    ...(project.access?.bundleOffer ? [project.access.bundleOffer] : []),
    ...(platformBundleOffers[project.primaryPlatform] ? [platformBundleOffers[project.primaryPlatform]] : []),
  ]

  const selectedOffers = (body.selectedOffers ?? [])
    .map(code => upsellPool.find(offer =>
      offer.productCode === code || offer.title === code,
    ))
    .filter((offer): offer is NonNullable<typeof offer> => Boolean(offer))

  const selectedPrices = selectedOffers.map((offer) => {
    const parsed = parsePriceLabel(offer.priceLabel)

    if (!parsed) {
      throw createError({
        statusCode: 422,
        statusMessage: `Offer price label for "${offer.title}" could not be parsed into a Stripe amount.`,
      })
    }

    if (parsed.currency !== basePrice.currency) {
      throw createError({
        statusCode: 422,
        statusMessage: 'All selected offers must use the same currency.',
      })
    }

    return parsed
  })

  const amount = selectedPrices.reduce((sum, price) => sum + price.amount, basePrice.amount)
  const buyerEmail = isNonEmptyString(body.buyerEmail) ? body.buyerEmail.trim() : undefined

  const stripe = new Stripe(config.stripeSecretKey)
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: basePrice.currency,
    automatic_payment_methods: {
      enabled: true,
    },
    receipt_email: buyerEmail,
    description: `Purchase: ${project.title}`,
    metadata: {
      projectSlug: project.slug,
      categorySlug: project.category,
      productCode: project.checkout.productCode,
      n8nFulfillmentKey: project.checkout.n8nFulfillmentKey ?? project.checkout.productCode,
      selectedOffers: selectedOffers.map(offer => offer.productCode ?? offer.title).join(','),
      buyerEmail: buyerEmail ?? '',
    },
  })

  if (!paymentIntent.client_secret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Stripe client secret was not returned.',
    })
  }

  return {
    clientSecret: paymentIntent.client_secret,
    amount,
    currency: basePrice.currency,
    paymentIntentId: paymentIntent.id,
  }
})
