# Settings Account And Template Checkout Design

## Goal

Add a production-ready Settings area and one-time template purchase flow with minimal friction:

- Settings with real data persistence in Supabase
- Account controls for session logout
- Guest Stripe checkout (no required login)
- Per-template lifetime access
- Delivery by email link after payment

## Product Decisions

- Payment model: one-time payment per template
- Buyer auth requirement: guest checkout allowed
- Entitlement scope: per-template lifetime access
- Delivery channel: email with access link (primary)
- Account sessions:
  - V1: real logout actions
  - V2: full active session table with device/location metadata

## Scope

### In scope (this phase)

- `/settings` page shell with left navigation
- Sections:
  - General
  - Notifications
  - Appearance
  - Account
- Bind General/Notifications/Appearance to:
  - `public.profiles`
  - `public.user_settings`
- Account actions:
  - log out this device
  - log out other devices
  - log out all devices
- Stripe Checkout Session for one-time purchases
- Order recording by buyer email
- Email delivery of template link after successful payment

### Out of scope (later phase)

- Full active sessions table with browser/device/location timestamps
- Subscription billing
- Team/org billing
- License transfer UI
- Refund self-service

## Existing Data Model (already created)

### `public.profiles`

- `id` (`auth.users.id`)
- `first_name`
- `last_name`
- `nickname`
- `email`
- `mobile_number`
- `phone_number`
- `work_description`
- `avatar_url`
- timestamps

### `public.user_settings`

- `user_id`
- `notify_response_completions`
- `notify_web_app_emails`
- `notify_dispatch_messages`
- `color_mode`
- `font_family`
- timestamps

Both tables have RLS with owner-only select/insert/update.

## Settings UX Design

### Route and layout

- New route: `/settings`
- Reuse current dark Claude-like visual language
- Two-column layout:
  - left: settings nav
  - right: section content

### Sections

#### General

Fields:

- Full Name (derived from first and last name)
- What should I call you? (`nickname`)
- What best describes your work? (`work_description`)
- Contact:
  - email
  - mobile number
  - phone number

Behavior:

- Save button or autosave with debounced mutation
- Normalize empty strings to `null`
- Validate email format on client before mutation

#### Notifications

Toggles mapped to `user_settings`:

- Response completions
- Emails from web app
- Dispatch messages

#### Appearance

- Color mode (light/dark/system)
- Font family

Color mode should sync with existing theme manager behavior.

#### Account

V1 controls:

- Log out this device
- Log out other devices
- Log out all devices
- Delete account button shown but disabled or guarded with “not available yet”

V1 intentionally does not display a session list table.

## Active Sessions Plan

### V1 (ship now)

Use built-in Supabase auth sign-out scopes:

- local
- others
- global

This gives real security behavior immediately without introducing inaccurate “fake session” rows.

### V2 (after V1)

Build full “Active sessions” table by adding server-side session inventory:

- resolve session IDs from auth/session claims
- store/update session metadata (user-agent, ip-derived location)
- expose via protected server endpoint for settings UI

Only ship table UI once backend metadata quality is good.

## Payments Architecture

### Why Checkout Sessions

For one-time template purchases, Stripe Checkout Sessions is the best fit:

- low PCI scope
- fastest reliable implementation
- supports guest email collection
- clean webhook lifecycle

### Core purchase entities

Add new tables in Supabase:

- `templates`
  - id, slug, name, price, stripe_price_id, active
- `orders`
  - id, stripe_checkout_session_id, stripe_payment_intent_id, buyer_email, status, currency, subtotal, total, created_at
- `order_items`
  - id, order_id, template_id, unit_amount, quantity
- `template_access`
  - id, template_id, buyer_email, order_id, granted_at

`template_access` is the entitlement table for per-template lifetime access.

### Purchase flow

1. User clicks buy on template page/card.
2. App calls server route to create Checkout Session.
3. Stripe-hosted checkout collects payment and email.
4. Stripe webhook `checkout.session.completed` arrives.
5. Webhook handler:
   - verifies signature
   - upserts order
   - inserts order items
   - grants `template_access`
   - queues/sends email with access link
6. Buyer receives email with template access link.

### Delivery

- Primary: email with link
- Secondary: success page confirmation

Access links can be:

- direct hosted file URL, or
- app route generating short-lived signed URLs from storage

Prefer signed URLs for better control.

## API/Server Endpoints

### Settings

- `GET /api/settings` -> load profile + user_settings
- `PATCH /api/settings/general`
- `PATCH /api/settings/notifications`
- `PATCH /api/settings/appearance`
- `POST /api/settings/account/logout` with scope

### Checkout

- `POST /api/checkout/create-session`
- `POST /api/stripe/webhook`
- `GET /api/orders/access-link` (email/token validated)

## Security Requirements

- Never expose Stripe secret key to client
- Verify webhook signatures on server
- Keep RLS enabled for user-owned settings tables
- Do not use editable metadata for authorization
- For guest purchase access, authorize by verified order/email token, not by raw query params

## Rollout Plan

### Phase 1

- Ship `/settings` with General, Notifications, Appearance, Account V1 actions
- Connect to existing `profiles` and `user_settings`

### Phase 2

- Add templates catalog commerce tables
- Implement Checkout Session + webhook + order recording
- Implement email delivery links

### Phase 3

- Add full Active Sessions table (device/location metadata)
- Replace placeholder account/session UI with real inventory

## Test Plan

### Settings

- load for authenticated user
- owner-only RLS validation
- update each section successfully
- invalid email blocked client-side and server-side

### Account

- local/others/global sign-out behavior
- session token invalidation behavior after expiry window

### Payments

- checkout creation for valid template
- webhook signature failure path
- webhook idempotency (same event twice)
- order and entitlement records created once
- delivery email sent on success

## Success Criteria

- User can edit profile and preferences in `/settings`
- Account section can terminate sessions via Supabase scopes
- Guest buyer can buy a template without logging in
- Purchase is recorded and linked to buyer email
- Buyer receives access link by email and can retrieve purchased template
