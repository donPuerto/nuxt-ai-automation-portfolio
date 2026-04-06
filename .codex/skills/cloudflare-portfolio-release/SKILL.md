---
name: cloudflare-portfolio-release
description: Prepare and verify releases for this Nuxt portfolio on Cloudflare by following the repo's Nitro cloudflare_module preset, asset behavior, and deployment-sensitive config in nuxt.config.ts.
---

# Cloudflare Portfolio Release

## Overview

Use this skill when the task involves deployment readiness, build output validation, Wrangler usage, or Cloudflare-specific configuration for this app.

## Workflow

1. Inspect `nuxt.config.ts` and `package.json` before changing deployment settings.
2. Confirm the Nitro preset, prerender behavior, and Cloudflare options still match the intended hosting model.
3. Verify environment-sensitive settings such as security headers, image behavior, and asset output names.
4. Run the smallest useful verification step before proposing deployment.

## Repo Rules

- Keep `nitro.preset` aligned with Cloudflare deployment intent.
- Treat changes to security headers and CSP as deployment-sensitive.
- Do not change `wrangler` or output settings casually; confirm the impact on Cloudflare first.
- Prefer additive release guidance over large config churn.
- Cloudflare Workers Builds for this repo use `npm@10.9.2`. When dependencies or the lockfile change, regenerate `package-lock.json` with `npx npm@10.9.2 install` so `npm ci` does not fail on missing nested lockfile entries like `cac@6.7.14`.

## Files To Check First

- `nuxt.config.ts`
- `package.json`
- `.wrangler/`
- `public/`
- `server/api/`

## Validation

- Run a production build when deployment behavior changes.
- Confirm no config edit breaks the Cloudflare Nitro target.
- If `package.json` or `package-lock.json` changed, verify the lockfile still contains the nested Cloudflare-critical entries for both `node_modules/@nuxt/cli/node_modules/cac` and `node_modules/vite-node/node_modules/cac` before pushing.
- Note any manual secrets or dashboard steps that code changes cannot complete.
