## Skills
A skill is a set of local instructions stored in a `SKILL.md` file. Use the project-local skills below when the task clearly matches the description or the user names the skill directly.

### Available project skills
- `portfolio-content-editor`: Update shared portfolio content, navigation, page copy, and personal-info modules while keeping content centralized in `shared/`. (file: ./.codex/skills/portfolio-content-editor/SKILL.md)
- `theme-system-maintainer`: Work on the repo's theme, color, radius, and layout mode system across `shared/themes`, `app/composables`, and theme CSS files. (file: ./.codex/skills/theme-system-maintainer/SKILL.md)
- `nuxt-ui-patterns`: Build and refactor app-facing UI in this repo using the existing local wrapper components in `app/components/ui` and `app/components/global`. (file: ./.codex/skills/nuxt-ui-patterns/SKILL.md)
- `cloudflare-portfolio-release`: Prepare, verify, and deploy this Nuxt app to Cloudflare with the repo's Nitro configuration and release checks. (file: ./.codex/skills/cloudflare-portfolio-release/SKILL.md)
- `figma-to-nuxt-ui`: Implement or refine designs coming from Figma MCP while mapping them onto this project's existing Nuxt, Tailwind, shadcn-nuxt, and theme conventions. (file: ./.codex/skills/figma-to-nuxt-ui/SKILL.md)

### Required framework skill policy (this project)
- Settings bootstrap rendering rule:`r`n  - For profile/settings screens that load user data on mount, gate content with `loading || !initialized` and show skeleton first.`r`n  - Do not render editable settings forms before initialization completes, to avoid blank/flicker states.`r`n
- Workspace Settings navigation reliability rule:
  - For Settings links in workspace chat surfaces (sidebar, prompt nav strip, profile dropdown), use direct anchor navigation to `/settings?section=general` unless router-based navigation has been explicitly re-verified for first-click reliability.
  - Treat URL-only change without view update as a regression; fix before closing the task.
  - Verification for any Settings-nav change must include first-click checks from all three entry points (sidebar, prompt nav, profile dropdown).
- Workspace canvas navigator rule:
  - Navigation prompt clicks (`me`, `projects`, `skills`, `discovery-call`, `settings`, and category views) are workspace canvas views, not chat messages.
  - Navigator clicks must render from code/local structured data in the same canvas and must not create recent-chat entries, saved conversation rows, or visible chat turns.
  - Only real free-text prompt submissions with `intent: 'prompt'` may append to conversation turns or create recent-chat history.
  - Treat a navigator click that displays previous navigator views, mixed sections, or chat history as a regression; fix before closing the task.
- Chat UI recurring standards (Claude-like):
  - Keep conversation thread compact; avoid large vertical gaps between turns.
  - During loading, keep previous turns visible and append loading state below the latest turn. Do not replace the whole thread with a loading row.
  - Assistant per-message action bar (`copy`, `thumbs-up`, `thumbs-down`, `retry`) must appear on hover only.
  - Message content should wrap naturally (`break-words` / `overflow-wrap:anywhere`) and must not introduce horizontal scrolling for normal text messages.
  - User prompt chips should use tight rounded-rectangle styling (not oversized circular pills for short text).
  - Assistant mark should use the lightweight icon treatment (no heavy bordered avatar circle unless explicitly requested).
  - Sonner toasts must follow project Claude theme tokens in both light and dark mode.
  - Do not enable Sonner `rich-colors` in this project.
- For every Vue file change, apply `vue-best-practices`.
- For every Nuxt feature/change, apply `nuxt` in addition to `vue-best-practices`.
- For store/state work, prefer `pinia` (and `vue-pinia-best-practices` where applicable).
- For route/navigation work, apply `vue-router-best-practices`.
- For Vue/Nuxt tests, apply `vue-testing-best-practices` (and `vitest` for unit/component tests).
- For composables and reactive utilities, apply `vueuse-functions` and `vueuse-best-practices` aliases when relevant.
- Use the smallest skill set that fully covers the task, but do not omit `vue-best-practices` for Vue code in this repo.

### How to use project skills
- Open the `SKILL.md` only when the task needs that skill.
- Prefer the smallest set of skills that fully covers the task.
- If a task overlaps with built-in session skills, use the project-local skill first for repo conventions, then use the broader skill for framework rules if needed.
- UI implementation priority for this repo:
  - First: reuse existing local `app/components/ui` wrappers and shadcn-nuxt/shadcn-style components.
  - Strict rule: prefer existing shadcn/local UI wrappers first for every new UI surface.
  - For toast and notification feedback, prefer the local shadcn-style Sonner wrapper when available.
  - Second: if the needed primitive is missing, install or add the matching shadcn-style component before inventing a custom pattern.
  - Third: if no shadcn/local component exists, build the component with Tailwind utilities following nearby repo patterns.
  - Last: use custom CSS only when the UI cannot be expressed cleanly with the existing component layer plus Tailwind.
- Do not duplicate content data inside page components when it already belongs in `shared/`.
- When implementing design work, preserve the existing theme and layout controls unless the task explicitly changes them.
- After running installs, builds, tests, or dev commands, check terminal output for warnings and errors.
- For dependency changes in this repo, keep `package-lock.json` compatible with Cloudflare Workers Builds (`npm@10.9.2`). If install or lockfile work is needed for release stability, regenerate the lockfile with `npx npm@10.9.2 install` before pushing.
- After code changes or verification steps, also check the editor Problems state or rerun the equivalent lint/typecheck commands so stale diagnostics do not get mistaken for live issues.
- Fix actionable terminal errors as part of the current task whenever it is safe and relevant to do so.
- Fix actionable Problems items as part of the current task whenever it is safe and relevant to do so.
- Do not claim success while blocking terminal errors remain unresolved.
- Do not claim success while blocking Problems items or stale diagnostics remain unresolved or unverified.
- If a terminal issue is risky, unrelated, or would require broader refactoring or a product decision, stop and explain it clearly before proceeding.

## MCP
This repo includes workspace MCP configuration for Figma at [mcp.json](/d:/Code/Nuxt/v4/nuxt-ai-automation-portfolio/mcp.json) and [.vscode/mcp.json](/d:/Code/Nuxt/v4/nuxt-ai-automation-portfolio/.vscode/mcp.json).

The active workspace Supabase MCP target for this app is project ref `cidyudlrjfrjvwmytwhd`. Keep both [mcp.json](/d:/Code/Nuxt/v4/nuxt-ai-automation-portfolio/mcp.json) and [.vscode/mcp.json](/d:/Code/Nuxt/v4/nuxt-ai-automation-portfolio/.vscode/mcp.json) aligned to that ref unless the app is intentionally moved again.

The workspace can hold multiple n8n MCP accounts at once. Preserve existing n8n entries and add new ones under distinct names instead of replacing prior profiles.

The current local config includes two n8n MCP entries, `n8n-server` and `n8n-wr`. The `n8n-wr` profile is the WR-coded account and points at `https://n8n.srv1127913.hstgr.cloud/mcp-server/http` with its own Bearer token.

Native n8n API access for WR direct workflow reads uses the same hosted instance at `https://n8n.srv1127913.hstgr.cloud/api/v1` with the `X-N8N-API-KEY` header.

For the portfolio `Video to Text` app flow, the Nuxt server uses `NUXT_VIDEO_TO_TEXT_WEBHOOK_URL` and `NUXT_VIDEO_TO_TEXT_API_KEY` to call the n8n `Webhook: Video to Text API` node. The app sends the secret as `X-API-Key`, and that value must match the node's attached `Header Auth` credential. Reference: [docs/n8n/video-to-text-app-credentials.md](/d:/Code/Nuxt/v4/nuxt-ai-automation-portfolio/docs/n8n/video-to-text-app-credentials.md).

Playwright browser-extension work in this repo should use the bundled Chromium flow, not the user's normal Chrome or Edge profile.

Memory for Codex:
- Global Playwright CLI is installed and callable as `playwright`
- Global extension launcher is installed and callable as `pw-extension-launcher`
- Repo launcher script is [scripts/launch-playwright-extension.mjs](/d:/Code/Nuxt/v4/nuxt-ai-automation-portfolio/scripts/launch-playwright-extension.mjs)
- Windows global shim entry is provided by the repo `bin` mapping in [package.json](/d:/Code/Nuxt/v4/nuxt-ai-automation-portfolio/package.json:5)
- Install the Playwright browser runtime with `npm run pw:install-chromium` or `playwright install chromium`
- Launch an unpacked extension with `pw-extension-launcher --extension=PATH [--url=http://127.0.0.1:3000]`
- Repo-local equivalent: `npm run pw:extension -- --extension=PATH [--url=http://127.0.0.1:3000]`
- Use an unpacked extension folder containing `manifest.json`
- Do not treat this as a Chrome Web Store install or a way to control the user's personal Chrome/Edge profile directly

To finish authentication for Codex CLI, run:

```bash
codex mcp add figma --url https://mcp.figma.com/mcp
```

Then approve the Figma login flow when prompted.


