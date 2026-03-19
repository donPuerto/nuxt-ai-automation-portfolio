# Retell Book Call Modal Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current `Book a call` links with a modal-based Retell web-call flow powered by a Nuxt API route that proxies to the n8n webhook.

**Architecture:** A reusable global call button opens a shadcn dialog, explains the call, then starts a Retell web call only after the user explicitly clicks `Start call`. The client talks only to a Nuxt server route; the server route calls the configured n8n webhook with the Retell agent id and returns the access token needed by the Retell SDK.

**Tech Stack:** Nuxt 4, TypeScript, local shadcn-nuxt dialog/button/card wrappers, retell-client-js-sdk, Nitro server routes, runtimeConfig

---

## File map

- Create: `app/components/global/call/DiscoveryCallButton.vue`
  - Reusable CTA + modal with Retell call state and controls.
- Create: `server/api/retell/start-web-call.post.ts`
  - Server-side proxy to the n8n webhook that requests the Retell access token.
- Modify: `nuxt.config.ts`
  - Add runtime config for Retell agent id and n8n webhook details.
- Modify: `.env.example`
  - Document required Retell and n8n env vars.
- Modify: `app/components/global/navigation/index.vue`
  - Replace the top-right `Book a call` link with the new call button.
- Modify: `app/components/global/catalog/CatalogHero.vue`
  - Replace the hero secondary CTA with the new call button.
- Modify: `app/pages/project-detail.vue`
  - Replace `Need a custom version?` contact link with the new call button.
- Modify: `app/pages/project-access.vue`
  - Replace the custom-version contact CTA with the new call button.

