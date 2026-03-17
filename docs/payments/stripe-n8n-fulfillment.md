# Stripe + n8n Fulfillment Contract

## Overview

This portfolio uses Stripe for checkout and forwards successful purchase events to n8n for fulfillment. n8n is responsible for sending the Gmail delivery email that contains the workflow links and setup notes.

## Environment variables

Set these in the Nuxt app:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `N8N_FULFILLMENT_WEBHOOK_URL`
- `N8N_FULFILLMENT_WEBHOOK_TOKEN` (optional)

## Project metadata contract

Each sellable project should define:

- `checkout.productCode`
- `checkout.stripePriceId`
- `checkout.n8nFulfillmentKey`
- `delivery.emailSubject`
- `delivery.emailPreview`
- `delivery.instructions`
- `delivery.links`

Optional add-ons and bundle offers should define:

- `stripePriceId`
- `productCode`

## Stripe checkout metadata

The Nuxt checkout session endpoint sends this metadata to Stripe:

- `projectSlug`
- `categorySlug`
- `productCode`
- `n8nFulfillmentKey`
- `selectedOffers`
- `buyerEmail`

## Stripe webhook event

Nuxt listens for:

- `checkout.session.completed`

Once verified, Nuxt forwards a normalized payload to n8n:

```json
{
  "type": "checkout.session.completed",
  "eventId": "evt_xxx",
  "sessionId": "cs_test_xxx",
  "projectSlug": "podcast-publisher-engine",
  "categorySlug": "content-social-media",
  "productCode": "n8n-podcast-publisher-engine",
  "n8nFulfillmentKey": "n8n-podcast-publisher-engine",
  "buyerEmail": "buyer@example.com",
  "selectedOffers": ["content-ops-kickstart-pack"],
  "amountTotal": 14900,
  "currency": "usd",
  "paymentStatus": "paid"
}
```

## Recommended n8n workflow

1. **Webhook trigger**
   - Receive the POST from Nuxt.

2. **Optional token validation**
   - If `N8N_FULFILLMENT_WEBHOOK_TOKEN` is used, verify the Authorization header before continuing.

3. **Lookup delivery content**
   - Use `n8nFulfillmentKey` or `productCode` to map the purchase to the correct workflow links, setup notes, and add-ons.

4. **Build the Gmail message**
   - Subject should come from the project delivery metadata.
   - Include:
     - thank-you line
     - workflow links
     - setup instructions
     - purchased add-ons if present

5. **Send Gmail**
   - Use the Gmail node in n8n.
   - Send to `buyerEmail`.

6. **Optional logging**
   - Store the sale in Google Sheets, Supabase, or Notion for tracking.

## Suggested Gmail email structure

### Subject

Use the project’s `delivery.emailSubject`.

### Body

Recommended structure:

1. Greeting and payment confirmation
2. Project name
3. Delivery links
4. Setup instructions
5. Any add-on or bundle notes
6. Support contact / response expectations

## Stripe dashboard setup

1. Create a product and price for each project.
2. Copy the Stripe price ID into the project JSON.
3. Configure the webhook endpoint to point to:
   - `/api/stripe/webhook`
4. Subscribe the webhook to:
   - `checkout.session.completed`

## Notes

- This v1 uses email delivery after payment rather than an on-site download library.
- If the buyer needs resend support, you can replay the fulfillment in n8n using the product code and email.
