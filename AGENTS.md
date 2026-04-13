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
  - For toast and notification feedback, prefer the local shadcn-style Sonner wrapper when available.
  - Second: if the needed component does not exist, build it with Tailwind utilities following nearby repo patterns.
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

To finish authentication for Codex CLI, run:

```bash
codex mcp add figma --url https://mcp.figma.com/mcp
```

Then approve the Figma login flow when prompted.


