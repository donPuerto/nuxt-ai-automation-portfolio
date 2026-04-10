# Supabase Migration Refactor (2026-04-10)

This repo now uses a clean ordered migration set:

- `supabase/migrations/20260410_0001_core_profiles_settings.sql`
- `supabase/migrations/20260410_0002_auth_bootstrap.sql`
- `supabase/migrations/20260410_0003_chat_schema.sql`
- `supabase/migrations/20260410_0004_template_checkout.sql`
- `supabase/migrations/20260410_0005_integrations_extensions_mcp.sql`
- `supabase/migrations/20260410_0006_ai_models_catalog.sql`

## Why this refactor

- Replaced fragmented migrations with one coherent baseline.
- Added first-class chat persistence (`chats`, `messages`, `saved_prompts`).
- Kept existing app contract for `profiles` and `user_settings`.
- Added API + MCP data model with RLS and auditability.

## Chat tables added

### `public.chats`
- User-owned conversation container
- Tracks selected provider/model
- Includes lifecycle fields (`status`, `archived_at`, `last_message_at`)

### `public.messages`
- Message-level records linked to chat and user
- Role-constrained (`system`, `user`, `assistant`, `tool`)
- Includes metadata and token counters

### `public.saved_prompts`
- Reusable prompt library per user
- Supports tags, favorites, and usage timestamps

## API + MCP tables

### `public.extensions_catalog`
- Global list of apps/extensions shown in your Extensions UI.

### `public.user_extensions`
- Per-user connected/disabled/error state for each extension.

### `public.api_providers`
- Global provider catalog (OpenRouter, Anthropic, OpenAI, n8n, Supabase, GitHub, Figma)

### `public.user_api_connections`
- Per-user provider connection entries (credential references, status, defaults, extension link)

### `public.api_keys`
- User-owned hashed API keys with usage and revocation tracking
- Helper function: `public.touch_api_key_usage(p_key_hash text)`

### `public.mcp_servers`
- MCP server registry (private user servers + optional shared/global servers)

### `public.mcp_tools`
- Tool definitions per MCP server

### `public.mcp_tool_calls`
- Tool execution logs for audit/debug/analytics

## AI model catalog tables

### `public.ai_models_catalog`
- Cross-provider model registry for OpenRouter, Claude, and OpenAI.
- Includes:
  - free vs paid (`is_free`)
  - active/display flags (`is_active`, `is_displayable`)
  - deprecated state (`is_deprecated`)
  - pricing and capabilities metadata

### `public.ai_model_sync_runs`
- Sync audit table to record provider sync runs and errors.

### `public.user_model_visibility`
- Per-user hide/show model overrides while keeping full catalog in DB.

## Security and behavior

- RLS enabled across all user data tables.
- Ownership policies applied for user-owned records.
- Trigger-based `updated_at` via `public.set_updated_at()`.
- `messages` insert trigger updates `chats.last_message_at`.

## Important implementation note

- Secrets are not stored raw in database tables.
- Store only references (`credential_ref`) and keep secret values in secure secret storage.
