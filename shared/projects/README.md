# Project Library

This folder is the manual posting library for the portfolio catalog.

## How it works

- Projects are authored by platform folder.
- The site still groups and browses projects by category.
- Each project file includes its own `category` metadata, so the UI can place it correctly.

## Where to post a project

- `shared/projects/n8n/`
- `shared/projects/claude-worker/`
- `shared/projects/ghl/`
- `shared/projects/zapier/`
- `shared/projects/make/`
- `shared/projects/full-stack/`
- `shared/projects/mobile/`

## How to add a new project

1. Copy `_template.json` inside the platform folder you want.
2. Rename it to a new slug, for example `lead-intake-dashboard.json`.
3. Fill in the project fields.
4. Import the new file in `shared/catalog/projects.ts` and add it to `catalogProjects`.

## Important notes

- `primaryPlatform` should match the folder the file lives in.
- `category` controls where the project appears in the catalog.
- `platforms` is a display list for badges on cards and detail pages.
- Keep private client work anonymized by setting `visibility` to `anonymized` and `anonymized` to `true`.
