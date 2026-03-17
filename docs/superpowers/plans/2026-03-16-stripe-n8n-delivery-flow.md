# Stripe + n8n Delivery Flow Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a paid access flow where project access pages use Stripe for checkout and n8n fulfills purchases by emailing workflow links to buyers.

**Architecture:** Keep the portfolio and project pages portfolio-first, and use the `/projects/:category/:slug/access` route as the payment shell. Stripe handles checkout and payment confirmation, Nuxt provides the minimal API surface and success/cancel routes, and n8n handles post-payment fulfillment through a Stripe webhook that sends Gmail delivery emails with project links.

**Tech Stack:** Nuxt 4, TypeScript, local shadcn-nuxt UI wrappers, Stripe Checkout or Payment Links, Stripe webhooks, n8n webhook workflow, Gmail from n8n, shared project content in `shared/projects/`

---

## File map

- Modify: `shared/catalog/types.ts`
  - Extend the shared project schema with checkout and delivery metadata needed for Stripe and n8n fulfillment.
- Modify: `shared/projects/**/_template.json`
  - Update authoring templates so each project can define product code, Stripe price metadata, and email delivery links.
- Modify: `shared/projects/**/*.json`
  - Seed one or two real projects with concrete checkout and delivery fields for end-to-end verification.
- Modify: `shared/catalog/content.ts`
  - Replace the current generic access-page payment copy with Stripe-oriented wording and simple fulfillment messaging.
- Modify: `app/pages/project-access.vue`
  - Turn the access page into a Stripe-first payment shell with payment-method messaging, summary, guarantee, and upsells.
- Create: `app/pages/checkout-success.vue`
  - Show the buyer what happens next after a successful payment and tell them to check email for delivery.
- Create: `app/pages/checkout-cancelled.vue`
  - Give buyers a clear recovery path after cancelling checkout.
- Create: `server/api/stripe/create-checkout-session.post.ts`
  - Create Stripe Checkout Sessions from project metadata.
- Create: `server/api/stripe/webhook.post.ts`
  - Verify Stripe signatures and forward a normalized payload to n8n.
- Modify: `nuxt.config.ts`
  - Add runtime config for Stripe and n8n webhook integration.
- Modify: `.env.example`
  - Document required Stripe and n8n environment variables.
- Create: `docs/payments/stripe-n8n-fulfillment.md`
  - Document the Stripe dashboard setup, required metadata, and the n8n workflow contract.

## Chunk 1: Catalog and content model

### Task 1: Extend shared project types

**Files:**
- Modify: `shared/catalog/types.ts`

- [ ] **Step 1: Add checkout metadata to the type layer**

Add fields that let each project declare:
- product code or purchase key
- Stripe price id or payment link id
- delivery email subject/body
- delivery links array
- optional upsell metadata

- [ ] **Step 2: Keep the shape small and delivery-focused**

Avoid account-library fields for now. Keep only what Stripe checkout and n8n fulfillment need.

- [ ] **Step 3: Run typecheck**

Run: `npx nuxt typecheck`

Expected: pass with no new type errors.

### Task 2: Update project templates

**Files:**
- Modify: `shared/projects/n8n/_template.json`
- Modify: `shared/projects/claude-worker/_template.json`
- Modify: `shared/projects/ghl/_template.json`
- Modify: `shared/projects/zapier/_template.json`
- Modify: `shared/projects/make/_template.json`
- Modify: `shared/projects/full-stack/_template.json`
- Modify: `shared/projects/mobile/_template.json`

- [ ] **Step 1: Add the new checkout and delivery fields to every template**

Each template should include placeholders for:
- `checkout`
- `delivery`
- optional `upsells`

- [ ] **Step 2: Keep the templates copy-paste friendly**

Use realistic placeholder values and comments-free JSON so future authoring stays easy.

### Task 3: Seed one or two real projects

**Files:**
- Modify: `shared/projects/n8n/podcast-publisher-engine.json`
- Modify: `shared/projects/ghl/lead-follow-up-sequence.json`

- [ ] **Step 1: Add real example checkout metadata**

Populate:
- sample Stripe price id
- product code
- delivery email subject
- workflow download links

- [ ] **Step 2: Add a minimal n8n fulfillment key**

Use a stable product code like `n8n-podcast-publisher-engine`.

## Chunk 2: Access-page UI and route flow

### Task 4: Refine the access page shell

**Files:**
- Modify: `app/pages/project-access.vue`
- Modify: `shared/catalog/content.ts`

- [ ] **Step 1: Reframe copy around Stripe checkout**

Replace generic payment language with:
- card / Link / Google Pay support
- delivery by email
- secure checkout language

- [ ] **Step 2: Structure the access page into clear sections**

Use the current shadcn wrappers to show:
- payment methods
- order summary
- guarantee
- upsells
- “check your email after purchase” expectations

- [ ] **Step 3: Keep the UI shell-only for now**

Do not embed Stripe Elements yet in this phase if Stripe Checkout or Payment Links are the selected v1 path.

### Task 5: Add success and cancellation routes

**Files:**
- Create: `app/pages/checkout-success.vue`
- Create: `app/pages/checkout-cancelled.vue`

- [ ] **Step 1: Create a successful payment page**

Show:
- payment received
- delivery email is on the way
- back-to-project link

- [ ] **Step 2: Create a cancelled payment page**

Show:
- checkout cancelled
- retry CTA back to access page

- [ ] **Step 3: Verify navigation manually**

Run the dev app and confirm both pages render cleanly.

## Chunk 3: Stripe server integration

### Task 6: Add Stripe runtime configuration

**Files:**
- Modify: `nuxt.config.ts`
- Modify: `.env.example`

- [ ] **Step 1: Add server runtime config**

Document and wire:
- `STRIPE_SECRET_KEY`
- `NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `N8N_FULFILLMENT_WEBHOOK_URL`
- optional `N8N_FULFILLMENT_WEBHOOK_TOKEN`

- [ ] **Step 2: Keep secrets server-only**

Only the publishable key should be exposed publicly.

### Task 7: Create checkout session endpoint

**Files:**
- Create: `server/api/stripe/create-checkout-session.post.ts`

- [ ] **Step 1: Accept project purchase input**

Read:
- project slug
- category
- optional upsell selections

- [ ] **Step 2: Resolve project purchase metadata**

Look up the matching project in shared data and derive:
- Stripe price id
- success URL
- cancel URL
- metadata for n8n fulfillment

- [ ] **Step 3: Create Stripe Checkout Session**

Use Stripe’s server SDK or fetch API to create a checkout session with:
- product metadata
- customer email if collected
- success/cancel URLs

- [ ] **Step 4: Return checkout URL**

The access page should use this to redirect the buyer.

### Task 8: Add Stripe webhook endpoint

**Files:**
- Create: `server/api/stripe/webhook.post.ts`

- [ ] **Step 1: Verify the Stripe signature**

Reject invalid payloads and log safely.

- [ ] **Step 2: Normalize the successful event**

Handle `checkout.session.completed` and prepare a clean payload containing:
- project code
- category
- buyer email
- selected upsells
- Stripe ids for traceability

- [ ] **Step 3: Forward the event to n8n**

POST the normalized payload to the configured n8n fulfillment webhook.

- [ ] **Step 4: Return a stable webhook response**

Return `200` only when the event is accepted or safely ignored.

## Chunk 4: n8n fulfillment contract

### Task 9: Write the n8n contract document

**Files:**
- Create: `docs/payments/stripe-n8n-fulfillment.md`

- [ ] **Step 1: Document the Stripe metadata contract**

List the fields Stripe must send for n8n:
- `projectSlug`
- `categorySlug`
- `productCode`
- `customerEmail`
- `upsells`

- [ ] **Step 2: Document the n8n workflow steps**

The workflow should:
1. receive webhook
2. validate secret if configured
3. map product code to delivery content
4. send Gmail message with workflow links
5. optionally log the sale

- [ ] **Step 3: Document Gmail delivery format**

Include:
- subject line pattern
- email body structure
- where workflow links should come from

## Chunk 5: Verification

### Task 10: Verify the app and payment shell

**Files:**
- Modify as needed based on findings from earlier tasks

- [ ] **Step 1: Run lint**

Run: `npx eslint .`

Expected: pass with no errors.

- [ ] **Step 2: Run typecheck**

Run: `npx nuxt typecheck`

Expected: pass with no errors.

- [ ] **Step 3: Run production build**

Run: `npm run build`

Expected: pass; only existing known sourcemap warnings may remain.

- [ ] **Step 4: Manual browser verification**

Check:
- `View project` works
- `Get Instant Access` works
- access page renders payment shell correctly
- success and cancelled pages render

- [ ] **Step 5: Manual Stripe and n8n smoke test**

In test mode:
- create a test checkout session
- complete a test payment
- confirm webhook is received
- confirm n8n receives the payload
- confirm Gmail email is sent with the correct workflow link

