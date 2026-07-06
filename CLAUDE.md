# nuxt-ai-automation-portfolio

## Project Overview

Nuxt 4 AI automation portfolio deployed on Cloudflare Workers.

## Skills - Always Use When Available

### n8n Skills
| Task | Skill |
|------|-------|
| Building/designing workflows | `n8n-workflow-patterns` |
| Configuring nodes | `n8n-node-configuration` |
| Writing expressions | `n8n-expression-syntax` |
| Using n8n MCP tools | `n8n-mcp-tools-expert` |
| Fixing validation errors | `n8n-validation-expert` |
| Writing JS in Code nodes | `n8n-code-javascript` |
| Writing Python in Code nodes | `n8n-code-python` |
| n8n CLI usage | `n8n-cli` |

### UI / Styling Skills
| Task | Skill |
|------|-------|
| Tailwind CSS design system & utilities | `tailwind-design-system` |
| shadcn component implementation | `shadcn` |
| Figma to code | `figma:implement-design` |
| Frontend UI design | `frontend-design` |

### Claude / Anthropic Skills
| Task | Skill |
|------|-------|
| Claude API / SDK integration | `claude-api` |
| Building MCP servers | `mcp-builder` |
| Frontend UI design | `frontend-design` |
| Web app testing | `webapp-testing` |
| PDF / PPTX / DOCX / XLSX | `pdf`, `pptx`, `docx`, `xlsx` |

### Supabase Skills (always invoke for any Supabase work)
| Task | Skill |
|------|-------|
| General Supabase development | `supabase` |
| PostgreSQL best practices | `supabase-postgres-best-practices` |
| Supabase server-side patterns | `supabase-server` |
| Edge Functions | `supabase-edge-functions` |
| Security / RLS policies | `supabase-security` |
| Vitest unit tests | `vitest` |

### Cloudflare Skills (always invoke for any Cloudflare work)
| Task | Skill |
|------|-------|
| General Cloudflare concepts & products | `cloudflare` |
| Wrangler CLI usage | `wrangler` |
| Workers architecture & best practices | `workers-best-practices` |
| Web performance on the edge | `web-perf` |
| Durable Objects (stateful Workers) | `durable-objects` |
| Cloudflare Agents SDK | `agents-sdk` |
| Cloudflare Sandbox SDK | `sandbox-sdk` |
| Building AI agents on Cloudflare | `building-ai-agent-on-cloudflare` |
| Building MCP servers on Cloudflare | `building-mcp-server-on-cloudflare` |
| Cloudflare Email Routing / Workers | `cloudflare-email-service` |
| Migrating Nuxt to Vinext | `migrate-to-vinext` |
| Cloudflare Browser Rendering | `cloudflare-browser` |

## n8n Workflow Standards

### Native AI Nodes - Always Required
When any workflow in this project calls an LLM, always use the **native n8n AI node**. Never use raw HTTP Request nodes for AI APIs.

| Wrong | Right |
|-------|-------|
| `HTTP Request -> api.anthropic.com/v1/messages` | `@n8n/n8n-nodes-langchain.lmChatAnthropic` |
| `HTTP Request -> api.openai.com/v1/chat/completions` | `@n8n/n8n-nodes-langchain.lmChatOpenAi` |

### Use n8n Templates as Reference
Before building any workflow, always search [https://n8n.io/workflows/](https://n8n.io/workflows/) for a relevant template to use as a reference. Use `mcp__n8n-mcp__search_templates` to find them.

### Workflow Update Triad - Non-negotiable
Any time a workflow is modified, do all three before closing:
1. **Update Postman** - reflect changed endpoints, headers, or body schema
2. **Update n8n Sticky Notes** - keep Blue/Yellow/Orange notes in sync
3. **End-to-end test node by node** - verify each node output in n8n execution log

### n8n Instance
- URL: `https://n8n.srv1127913.hstgr.cloud`
- MCP endpoint: `https://n8n.srv1127913.hstgr.cloud/mcp-server/http`
- MCP server names in local config: `n8n-server`, `n8n-wr`
- WR MCP profile name: `n8n-wr`
- WR native API base: `https://n8n.srv1127913.hstgr.cloud/api/v1`
- WR native API auth header: `X-N8N-API-KEY`
- Preserve multiple n8n MCP profiles side by side; do not replace an existing profile when adding another account.
- Workflows related to this project use webhooks mapped in `.env`

## Cloudflare Deployment

- Worker name: `nuxt-ai-automation-portfolio`
- **Deploy command: `npm run deploy`** (builds then deploys via wrangler in one step)
- Raw command: `npm run build && npx wrangler --cwd .output deploy`
- KV namespace: `VIDEO_TO_TEXT_JOBS` (binding: `dead8846188b4f6298aafbeeb8afeddd`)
- Live URL: `https://nuxt-ai-automation-portfolio.don-puerto.workers.dev`
- Note: GitHub Actions CI is set up (`.github/workflows/deploy.yml`) but requires GitHub billing to be active. Deploy manually with `npm run deploy` until then.

## Auto Commit, Push & Deploy (REQUIRED after completing work)

When a change is **complete and verified**, do all three, in order, without waiting to be asked:

1. **Commit** — stage only the files for this change and commit with a conventional message
   (`feat:`, `fix:`, `chore:`, `docs:`, `ui:`, `refactor:`, `perf:`). End the message with the
   `Co-Authored-By` trailer. Do not sweep in unrelated pre-existing working-tree changes.
2. **Push** — `git push` to `origin` (set upstream on first push of a branch:
   `git push -u origin <branch>`). Remote is `github.com/donPuerto/nuxt-ai-automation-portfolio`,
   auth via the `gh` CLI (`donPuerto`).
3. **Deploy** — run `npm run deploy` (build + `wrangler` deploy to the `nuxt-ai-automation-portfolio` Worker).
   Report the live URL after it succeeds.

**Guardrails — skip the sequence and stop if any apply:**
- The build/typecheck fails, or the change is mid-task / not yet verified → do NOT commit or deploy.
- Work is exploratory, or the user is still iterating → wait until they confirm it's done.
- Never commit `.env` or any file containing secrets. `.mcp.json` / `.vscode/mcp.json` carry inline
  tokens — do not re-commit token changes; prefer `git update-index --skip-worktree` for them.
- If on the default branch (`main`), confirm with the user before pushing/deploying, since a push to
  `main` may trigger CI and a deploy ships the live site.

This is the standard "finish a task" flow for this repo: **verify → commit → push → `npm run deploy`.**

## Environment Files

- `.env` - public config (URLs, public keys) - can be committed
- `.env.local` - secrets (API keys, tokens) - never commit
- `.env.example` - template with placeholder values

## Supabase MCP Memory

- The current app-facing Supabase MCP project ref is `cidyudlrjfrjvwmytwhd` (matches `NUXT_SUPABASE_URL` in `.env`; this is the "Ai Automation" project with the real app schema)
- Keep `.mcp.json` and `.vscode/mcp.json` aligned to that ref unless the app is intentionally moved
- Changing only MCP does not repoint the running app; the app still reads its Supabase URL and keys from env

Never edit `.env` files with tools - edit manually only (hook enforced).

### Supabase env var naming convention (follow exactly)
Use Supabase's own key names with the `NUXT_` prefix. The code in `nuxt.config.ts` reads these exact names and maps them into runtime config:

| Env var | Runtime config key | Notes |
|---------|--------------------|-------|
| `NUXT_SUPABASE_URL` | `public.supabaseUrl` | exposed to client (inlined at build) |
| `NUXT_SUPABASE_PUBLISHABLE_KEY` | `public.supabaseKey` | `sb_publishable_...`, exposed to client |
| `NUXT_SUPABASE_SECRET_KEY` | `supabaseSecretKey` | `sb_secret_...`, preferred server admin credential |
| `NUXT_SUPABASE_SERVICE_ROLE_KEY` | `supabaseServiceRoleKey` | legacy service_role JWT, admin fallback |
| `NUXT_SUPABASE_JWKS_URL` | `supabaseJwksUrl` | for verifying Supabase-issued JWTs |

Do NOT rename these to `NUXT_PUBLIC_SUPABASE_*` — the URL/publishable key reach the client via explicit `runtimeConfig.public` assignment, not the `NUXT_PUBLIC_` auto-prefix. The admin client (`server/utils/supabase-admin.ts`) prefers `supabaseSecretKey`, then `supabaseServiceRoleKey`.

## Playwright Extension Memory

- Global Playwright CLI is installed and callable as `playwright`
- Global extension launcher is installed and callable as `pw-extension-launcher`
- Repo-local launcher script is `scripts/launch-playwright-extension.mjs`
- Repo-local npm scripts:
  - `npm run pw:install-chromium`
  - `npm run pw:extension -- --extension=PATH [--url=http://127.0.0.1:3000]`
- Preferred global launch command:
  - `pw-extension-launcher --extension=PATH [--url=http://127.0.0.1:3000]`
- Browser-extension automation must use Playwright's bundled `chromium` persistent-context flow
- Do not assume this installs into or controls the user's normal Chrome or Edge profile
- The target must be an unpacked extension folder that contains `manifest.json`
