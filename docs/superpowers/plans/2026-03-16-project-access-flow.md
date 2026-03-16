# Project Access Flow Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated project access page with checkout and optional upsells, while keeping the catalog and project detail pages portfolio-first.

**Architecture:** Extend the shared project schema with optional access-offer metadata, derive sensible defaults from existing project fields, and add a new `/systems/[category]/[slug]/access` route. The detail page remains the proof layer; the access page becomes the payment and upsell layer.

**Tech Stack:** Nuxt 4, Vue 3, TypeScript, shadcn-nuxt, Tailwind CSS

---

### Task 1: Extend shared catalog schema

**Files:**
- Modify: `shared/catalog/types.ts`
- Modify: `shared/projects/*/_template.json`

- [ ] Add types for access-page offer content and upsells.
- [ ] Add optional access-offer fields to `CatalogProject`.
- [ ] Update project templates so new entries can opt into the access page cleanly.

### Task 2: Build reusable access-page UI

**Files:**
- Create: `app/components/global/catalog/CatalogAccessOfferCard.vue`

- [ ] Create a reusable card for optional upsells and bundle offers.
- [ ] Keep styling within existing catalog card and shadcn button/card conventions.

### Task 3: Add the project access page

**Files:**
- Create: `app/pages/systems/[category]/[slug]/access.vue`

- [ ] Build the access page using project data plus optional offer overrides.
- [ ] Show core offer summary, included items, checkout CTA, and optional upsells.
- [ ] Keep the route portfolio-adjacent rather than cart-like.

### Task 4: Update project detail CTA flow

**Files:**
- Modify: `app/pages/systems/[category]/[slug].vue`

- [ ] Replace the direct payment link CTA with `Get Instant Access`.
- [ ] Route the primary CTA to the new access page.
- [ ] Keep the secondary custom-build CTA.

### Task 5: Seed offer content

**Files:**
- Modify: `shared/projects/**/**/*.json` (selected entries)

- [ ] Add access-page copy and at least one example upsell to representative projects.
- [ ] Leave safe defaults so existing projects still render even without explicit access metadata.

### Task 6: Verify

**Files:**
- Verify: repo-wide

- [ ] Run `npx eslint .`
- [ ] Run `npx nuxt typecheck`
- [ ] Run `npm run build`
- [ ] Fix any blocking errors before completion
