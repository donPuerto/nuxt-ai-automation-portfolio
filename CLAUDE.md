# nuxt-ai-automation-portfolio

## Project Overview

Nuxt 4 AI automation portfolio deployed on Cloudflare Workers.

## Skills — Always Use When Available

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

### Native AI Nodes — Always Required
When any workflow in this project calls an LLM, always use the **native n8n AI node**. Never use raw HTTP Request nodes for AI APIs.

| Wrong | Right |
|-------|-------|
| `HTTP Request → api.anthropic.com/v1/messages` | `@n8n/n8n-nodes-langchain.lmChatAnthropic` |
| `HTTP Request → api.openai.com/v1/chat/completions` | `@n8n/n8n-nodes-langchain.lmChatOpenAi` |

### Use n8n Templates as Reference
Before building any workflow, always search [https://n8n.io/workflows/](https://n8n.io/workflows/) for a relevant template to use as a reference. Use `mcp__n8n-mcp__search_templates` to find them.

### Workflow Update Triad — Non-negotiable
Any time a workflow is modified, do all three before closing:
1. **Update Postman** — reflect changed endpoints, headers, or body schema
2. **Update n8n Sticky Notes** — keep Blue/Yellow/Orange notes in sync
3. **End-to-end test node by node** — verify each node output in n8n execution log

### n8n Instance
- URL: `https://n8n.srv1127913.hstgr.cloud`
- Workflows related to this project use webhooks mapped in `.env`

## Cloudflare Deployment

- Worker name: `nuxt-ai-automation-portfolio`
- **Deploy command: `npm run deploy`** (builds then deploys via wrangler in one step)
- Raw command: `npm run build && npx wrangler --cwd .output deploy`
- KV namespace: `VIDEO_TO_TEXT_JOBS` (binding: `dead8846188b4f6298aafbeeb8afeddd`)
- Live URL: `https://nuxt-ai-automation-portfolio.don-puerto.workers.dev`
- Note: GitHub Actions CI is set up (`.github/workflows/deploy.yml`) but requires GitHub billing to be active. Deploy manually with `npm run deploy` until then.

## Environment Files

- `.env` — public config (URLs, public keys) — can be committed
- `.env.local` — secrets (API keys, tokens) — never commit
- `.env.example` — template with placeholder values

Never edit `.env` files with tools — edit manually only (hook enforced).
