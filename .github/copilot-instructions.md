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

## Architecture overview
- Client-side code in app/, server-side in server/, shared logic in shared/ (currently minimal).
- Pages auto-route from app/pages/; use layouts/default.vue for consistent structure.
- Components organized by feature (features/portfolio/) or global scope.
- Theme management via @nuxtjs/color-mode; use useColorMode() composable.

## Data management
- Types defined in types/index.ts; shared types in shared/ folder.

## Development workflow
- Run `npm run dev` for development server on localhost:3000.
- Build with `npm run build`; preview with `npm run preview`.
- Lint with ESLint; type-check with TypeScript.
- Vite handles bundling with Tailwind plugin; no PostCSS needed.

## Adding content
- New pages: Add .vue files to app/pages/; use NuxtLink for navigation.
- New components: Place in components/ with auto-import; export from index.ts for explicit imports.

## Output expectations
- Provide complete, working code snippets.
- When modifying files, specify the file path and show the full updated block.
