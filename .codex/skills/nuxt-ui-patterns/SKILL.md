---
name: nuxt-ui-patterns
description: Build or refactor UI in this repo by reusing the existing local wrappers in app/components/ui and app/components/global, preserving the current Nuxt, Tailwind, shadcn-nuxt, and Reka UI patterns.
---

# Nuxt UI Patterns

## Overview

Use this skill for UI implementation work in this repository, especially when the task involves page sections, navigation, dialogs, menus, cards, form controls, or local component composition.

## Workflow

1. Check whether the needed primitive already exists in `app/components/ui`.
2. Prefer composing existing wrappers over introducing raw third-party primitives directly in feature code.
3. Match nearby patterns in `app/components/global` and `app/pages`.
4. Keep styling within the repo's Tailwind and theme-token conventions rather than hardcoding one-off colors.

## Repo Rules

- Reuse local UI wrappers such as button, card, dialog, select, navigation-menu, item, and alert components.
- Keep page-level sections in `app/components/global` when they are shared or substantial.
- Avoid bypassing established wrappers unless the task requires a missing primitive.
- If a new UI primitive is necessary, place it under `app/components/ui/<name>/` with an `index.ts` barrel.

## Files To Check First

- `app/components/ui/`
- `app/components/global/`
- `app/pages/`
- `app/lib/utils.ts`
- `components.json`
- `app/assets/css/tailwind.css`

## Validation

- Verify imports use existing barrels where available.
- Check responsive behavior against nearby components.
- Keep utility usage consistent with the rest of the repo.
