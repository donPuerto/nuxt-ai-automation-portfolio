# Copilot Instructions (Nuxt 4 + Tailwind 4 + shadcn + Inspira UI)

## Project stack
- Framework: Nuxt 4
- Styling: Tailwind CSS v4
- UI: shadcn-vue (via shadcn-nuxt) and Inspira UI components
- Language: TypeScript

## Coding defaults
- Vue SFCs must use: <script setup lang="ts">
- Prefer Composition API patterns.
- Prefer Nuxt conventions: pages/, layouts/, components/, composables/, plugins/.
- Use Nuxt auto-imports where appropriate (use explicit imports if unclear).
- Avoid adding PostCSS configs unless necessary; Tailwind v4 uses Vite plugin in this project.

## UI conventions
- Use shadcn-vue components under components/ui when applicable.
- Keep components accessible (labels, aria attrs when needed).
- Tailwind classes should be readable; prefer extracted components over massive class strings.

## Nuxt patterns
- Prefer server routes in server/api for backend calls.
- Prefer useFetch / $fetch for HTTP; handle errors with try/catch and show user-friendly messages.
- Use <ClientOnly> for browser-only components (canvas, window, document).

## Output expectations
- Provide complete, working code snippets.
- When modifying files, specify the file path and show the full updated block.
