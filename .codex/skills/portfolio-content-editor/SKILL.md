---
name: portfolio-content-editor
description: Update portfolio content in this repo by editing shared data modules, navigation, and page-level copy while keeping content centralized in shared/ instead of scattering literals through Vue components.
---

# Portfolio Content Editor

## Overview

Use this skill when the task is primarily about changing portfolio copy, navigation labels, personal information, testimonials, services, or other content-driven sections.

## Workflow

1. Inspect `shared/` first.
2. Change centralized exports in `shared/pages`, `shared/navigation`, `shared/footer`, or `shared/personal-info` before editing Vue templates.
3. Update page or component markup only when the structure must change, not just the text.
4. Verify that imports still resolve through `shared/index.ts` or the relevant barrel file.

## Repo Rules

- Treat `shared/` as the source of truth for reusable content.
- Avoid duplicating route names, labels, or portfolio facts directly inside `app/pages` and `app/components/global`.
- Preserve existing route paths unless the task explicitly requires URL changes.
- If a content change affects navigation or footer links, update both centralized data and any dependent UI.

## Files To Check First

- `shared/index.ts`
- `shared/pages/`
- `shared/navigation/`
- `shared/footer/`
- `shared/personal-info.ts`
- `app/pages/`
- `app/components/global/`

## Validation

- Confirm the changed content is still exported from the relevant barrel file.
- Check for stale literals with a targeted text search if content was renamed.
- Run the relevant local verification command when structure changed.
