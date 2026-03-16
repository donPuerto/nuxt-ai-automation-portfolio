---
name: figma-to-nuxt-ui
description: Translate Figma-driven UI work into this Nuxt codebase by using Figma MCP for design context and mapping the result onto the repo's existing Tailwind, theme, and local UI component conventions.
---

# Figma To Nuxt UI

## Overview

Use this skill when the user wants to implement, refine, or compare a Figma design in this repository, especially when Figma MCP context is available.

## Workflow

1. Use Figma MCP context when available to inspect layout, spacing, tokens, copy, and component structure.
2. Map the design onto existing local wrappers in `app/components/ui` and existing section patterns in `app/components/global`.
3. Reconcile the design with the repo's theme system instead of hardcoding a disconnected style layer.
4. If the design introduces new tokens or patterns, update the theme system or shared UI layer deliberately.

## Repo Rules

- Prefer implementation fidelity through existing primitives before adding new component abstractions.
- Keep content centralized in `shared/` when the design changes labels or copy that appear in multiple places.
- Respect responsive behavior; do not implement a desktop-only interpretation.
- If the design conflicts with current theme, color mode, or layout toggles, document the tradeoff in the task outcome.

## Files To Check First

- `app/components/global/`
- `app/components/ui/`
- `app/pages/`
- `shared/`
- `shared/themes/index.ts`
- `app/assets/css/themes/`

## Validation

- Compare the implemented structure against the Figma frame or MCP-provided details.
- Verify the result still works across the repo's theme and layout states.
- Check whether the design change should also update shared copy or theme metadata.
