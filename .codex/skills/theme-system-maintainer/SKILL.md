---
name: theme-system-maintainer
description: Maintain the custom theme and layout system in this repo, including theme CSS files, shared theme metadata, and the composables that manage theme, color, radius, and fixed layout state.
---

# Theme System Maintainer

## Overview

Use this skill when working on theme switching, font presets, color presets, border radius behavior, or the fixed/full layout mode used across the app.

## Workflow

1. Read the relevant shared theme metadata in `shared/themes/index.ts`.
2. Inspect the state and DOM class behavior in `app/composables/useThemeManager.ts`, `app/composables/useTheme.ts`, and `app/composables/useLayoutManager.ts`.
3. Update the corresponding CSS theme files in `app/assets/css/themes/` only after confirming the class names they depend on.
4. Verify that storage keys and class names stay aligned with `nuxt.config.ts` color mode settings.

## Repo Rules

- Theme IDs in `shared/themes/index.ts` must match CSS class expectations such as `theme-default` or `theme-vercel`.
- Do not introduce a new theme without adding both metadata and CSS.
- Preserve the existing storage behavior:
  - theme, color, radius use `sessionStorage`
  - layout mode uses `localStorage`
- Be careful with SSR. Client-only DOM access belongs behind `import.meta.client`.

## Files To Check First

- `shared/themes/index.ts`
- `app/composables/useThemeManager.ts`
- `app/composables/useTheme.ts`
- `app/composables/useLayoutManager.ts`
- `app/components/global/navigation/ThemeSelector.vue`
- `app/components/global/navigation/ThemeCustomizer.vue`
- `app/assets/css/themes/`
- `nuxt.config.ts`

## Validation

- Confirm there are no mismatched theme IDs or missing CSS files.
- Check that HTML classes and storage keys remain consistent.
- Verify that no client-only logic leaks into SSR execution paths.
