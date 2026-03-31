## Skills
A skill is a set of local instructions stored in a `SKILL.md` file. Use the project-local skills below when the task clearly matches the description or the user names the skill directly.

### Available project skills
- `portfolio-content-editor`: Update shared portfolio content, navigation, page copy, and personal-info modules while keeping content centralized in `shared/`. (file: ./.codex/skills/portfolio-content-editor/SKILL.md)
- `theme-system-maintainer`: Work on the repo's theme, color, radius, and layout mode system across `shared/themes`, `app/composables`, and theme CSS files. (file: ./.codex/skills/theme-system-maintainer/SKILL.md)
- `nuxt-ui-patterns`: Build and refactor app-facing UI in this repo using the existing local wrapper components in `app/components/ui` and `app/components/global`. (file: ./.codex/skills/nuxt-ui-patterns/SKILL.md)
- `cloudflare-portfolio-release`: Prepare, verify, and deploy this Nuxt app to Cloudflare with the repo's Nitro configuration and release checks. (file: ./.codex/skills/cloudflare-portfolio-release/SKILL.md)
- `figma-to-nuxt-ui`: Implement or refine designs coming from Figma MCP while mapping them onto this project's existing Nuxt, Tailwind, shadcn-nuxt, and theme conventions. (file: ./.codex/skills/figma-to-nuxt-ui/SKILL.md)

### How to use project skills
- Open the `SKILL.md` only when the task needs that skill.
- Prefer the smallest set of skills that fully covers the task.
- If a task overlaps with built-in session skills, use the project-local skill first for repo conventions, then use the broader skill for framework rules if needed.
- UI implementation priority for this repo:
  - First: reuse existing local `app/components/ui` wrappers and shadcn-nuxt/shadcn-style components.
  - Second: if the needed component does not exist, build it with Tailwind utilities following nearby repo patterns.
  - Last: use custom CSS only when the UI cannot be expressed cleanly with the existing component layer plus Tailwind.
- Do not duplicate content data inside page components when it already belongs in `shared/`.
- When implementing design work, preserve the existing theme and layout controls unless the task explicitly changes them.
- After running installs, builds, tests, or dev commands, check terminal output for warnings and errors.
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
