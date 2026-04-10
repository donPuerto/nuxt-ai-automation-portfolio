-- Integrations + Extensions + MCP schema

-- ---------------------------------------------------------------------------
-- 1) API providers (global catalog)
-- ---------------------------------------------------------------------------
create table if not exists public.api_providers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  auth_type text not null default 'api_key',
  base_url text,
  docs_url text,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint api_providers_slug_length check (char_length(trim(slug)) between 2 and 60),
  constraint api_providers_name_length check (char_length(trim(name)) between 2 and 120),
  constraint api_providers_auth_type_check check (auth_type in ('api_key', 'oauth2', 'bearer', 'custom'))
);

create index if not exists api_providers_active_idx
  on public.api_providers (is_active, slug);

drop trigger if exists set_api_providers_updated_at on public.api_providers;
create trigger set_api_providers_updated_at
before update on public.api_providers
for each row
execute function public.set_updated_at();

alter table public.api_providers enable row level security;

drop policy if exists "api_providers_select_active" on public.api_providers;
create policy "api_providers_select_active"
on public.api_providers
for select
to anon, authenticated
using (is_active = true);

-- ---------------------------------------------------------------------------
-- 2) Extensions catalog + per-user extension state
-- ---------------------------------------------------------------------------
create table if not exists public.extensions_catalog (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  provider_id uuid references public.api_providers (id) on delete set null,
  category text not null default 'integration',
  icon text,
  description text,
  homepage_url text,
  docs_url text,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint extensions_catalog_slug_length check (char_length(trim(slug)) between 2 and 80),
  constraint extensions_catalog_name_length check (char_length(trim(name)) between 2 and 120),
  constraint extensions_catalog_category_check check (category in ('integration', 'automation', 'ai', 'payments', 'storage', 'other'))
);

create index if not exists extensions_catalog_active_sort_idx
  on public.extensions_catalog (is_active, sort_order, name);

drop trigger if exists set_extensions_catalog_updated_at on public.extensions_catalog;
create trigger set_extensions_catalog_updated_at
before update on public.extensions_catalog
for each row
execute function public.set_updated_at();

alter table public.extensions_catalog enable row level security;

drop policy if exists "extensions_catalog_select_active" on public.extensions_catalog;
create policy "extensions_catalog_select_active"
on public.extensions_catalog
for select
to anon, authenticated
using (is_active = true);

create table if not exists public.user_extensions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  extension_id uuid not null references public.extensions_catalog (id) on delete cascade,
  status text not null default 'connected',
  is_enabled boolean not null default true,
  connected_at timestamptz not null default now(),
  last_sync_at timestamptz,
  last_error text,
  settings jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_extensions_status_check check (status in ('connected', 'disconnected', 'error', 'pending')),
  constraint user_extensions_user_extension_unique unique (user_id, extension_id)
);

create index if not exists user_extensions_user_enabled_idx
  on public.user_extensions (user_id, is_enabled, created_at desc);

drop trigger if exists set_user_extensions_updated_at on public.user_extensions;
create trigger set_user_extensions_updated_at
before update on public.user_extensions
for each row
execute function public.set_updated_at();

alter table public.user_extensions enable row level security;

drop policy if exists "user_extensions_select_own" on public.user_extensions;
create policy "user_extensions_select_own"
on public.user_extensions
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "user_extensions_insert_own" on public.user_extensions;
create policy "user_extensions_insert_own"
on public.user_extensions
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "user_extensions_update_own" on public.user_extensions;
create policy "user_extensions_update_own"
on public.user_extensions
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "user_extensions_delete_own" on public.user_extensions;
create policy "user_extensions_delete_own"
on public.user_extensions
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 3) User API connections and API keys
-- ---------------------------------------------------------------------------
create table if not exists public.user_api_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider_id uuid not null references public.api_providers (id) on delete cascade,
  user_extension_id uuid references public.user_extensions (id) on delete set null,
  display_name text not null,
  auth_type text not null default 'api_key',
  credential_ref text,
  scopes text[] not null default '{}'::text[],
  status text not null default 'active',
  last_tested_at timestamptz,
  last_error text,
  is_default boolean not null default false,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_api_connections_display_name_length check (char_length(trim(display_name)) between 1 and 120),
  constraint user_api_connections_auth_type_check check (auth_type in ('api_key', 'oauth2', 'bearer', 'custom')),
  constraint user_api_connections_status_check check (status in ('active', 'error', 'disabled'))
);

create unique index if not exists user_api_connections_single_default_idx
  on public.user_api_connections (user_id, provider_id)
  where is_default = true;

create index if not exists user_api_connections_user_idx
  on public.user_api_connections (user_id, is_active, created_at desc);

drop trigger if exists set_user_api_connections_updated_at on public.user_api_connections;
create trigger set_user_api_connections_updated_at
before update on public.user_api_connections
for each row
execute function public.set_updated_at();

alter table public.user_api_connections enable row level security;

drop policy if exists "user_api_connections_select_own" on public.user_api_connections;
create policy "user_api_connections_select_own"
on public.user_api_connections
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "user_api_connections_insert_own" on public.user_api_connections;
create policy "user_api_connections_insert_own"
on public.user_api_connections
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "user_api_connections_update_own" on public.user_api_connections;
create policy "user_api_connections_update_own"
on public.user_api_connections
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "user_api_connections_delete_own" on public.user_api_connections;
create policy "user_api_connections_delete_own"
on public.user_api_connections
for delete
to authenticated
using ((select auth.uid()) = user_id);

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  connection_id uuid references public.user_api_connections (id) on delete set null,
  name text not null,
  key_type text not null default 'personal',
  provider text,
  key_prefix text not null,
  key_hash text not null unique,
  scopes text[] not null default '{}'::text[],
  is_active boolean not null default true,
  usage_count bigint not null default 0,
  last_used_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_by_ip inet,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint api_keys_name_length check (char_length(trim(name)) between 1 and 120),
  constraint api_keys_prefix_length check (char_length(trim(key_prefix)) between 4 and 24),
  constraint api_keys_key_type_check check (key_type in ('personal', 'service', 'mcp', 'integration'))
);

create index if not exists api_keys_user_id_idx
  on public.api_keys (user_id, created_at desc);

create index if not exists api_keys_active_idx
  on public.api_keys (is_active, expires_at);

create index if not exists api_keys_provider_idx
  on public.api_keys (provider, is_active);

create index if not exists api_keys_last_used_idx
  on public.api_keys (last_used_at desc nulls last);

drop trigger if exists set_api_keys_updated_at on public.api_keys;
create trigger set_api_keys_updated_at
before update on public.api_keys
for each row
execute function public.set_updated_at();

create or replace function public.touch_api_key_usage(p_key_hash text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  _updated boolean := false;
begin
  update public.api_keys
  set
    last_used_at = now(),
    usage_count = usage_count + 1
  where key_hash = p_key_hash
    and is_active = true
    and revoked_at is null
    and (expires_at is null or expires_at > now());

  _updated := found;
  return _updated;
end;
$$;

grant execute on function public.touch_api_key_usage(text) to authenticated;
grant execute on function public.touch_api_key_usage(text) to service_role;

alter table public.api_keys enable row level security;

drop policy if exists "api_keys_select_own" on public.api_keys;
create policy "api_keys_select_own"
on public.api_keys
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "api_keys_insert_own" on public.api_keys;
create policy "api_keys_insert_own"
on public.api_keys
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "api_keys_update_own" on public.api_keys;
create policy "api_keys_update_own"
on public.api_keys
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "api_keys_delete_own" on public.api_keys;
create policy "api_keys_delete_own"
on public.api_keys
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 4) MCP servers, tools, and call logs
-- ---------------------------------------------------------------------------
create table if not exists public.mcp_servers (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references public.profiles (id) on delete cascade,
  connection_id uuid references public.user_api_connections (id) on delete set null,
  user_extension_id uuid references public.user_extensions (id) on delete set null,
  name text not null,
  slug text not null,
  provider_kind text not null default 'custom',
  transport text not null default 'http',
  endpoint_url text not null,
  headers jsonb not null default '{}'::jsonb,
  features text[] not null default '{}'::text[],
  read_only boolean not null default false,
  enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mcp_servers_name_length check (char_length(trim(name)) between 2 and 120),
  constraint mcp_servers_slug_length check (char_length(trim(slug)) between 2 and 80),
  constraint mcp_servers_provider_kind_check check (
    provider_kind in ('custom', 'figma', 'supabase', 'n8n', 'github', 'openrouter', 'openai', 'claude', 'other')
  ),
  constraint mcp_servers_transport_check check (transport in ('http', 'sse', 'stdio', 'websocket'))
);

create unique index if not exists mcp_servers_owner_slug_idx
  on public.mcp_servers (coalesce(owner_user_id, '00000000-0000-0000-0000-000000000000'::uuid), slug);

create index if not exists mcp_servers_enabled_idx
  on public.mcp_servers (enabled, provider_kind, created_at desc);

drop trigger if exists set_mcp_servers_updated_at on public.mcp_servers;
create trigger set_mcp_servers_updated_at
before update on public.mcp_servers
for each row
execute function public.set_updated_at();

alter table public.mcp_servers enable row level security;

drop policy if exists "mcp_servers_select_visible" on public.mcp_servers;
create policy "mcp_servers_select_visible"
on public.mcp_servers
for select
to authenticated
using (
  ((select auth.uid()) = owner_user_id)
  or (owner_user_id is null and enabled = true)
);

drop policy if exists "mcp_servers_insert_own" on public.mcp_servers;
create policy "mcp_servers_insert_own"
on public.mcp_servers
for insert
to authenticated
with check ((select auth.uid()) = owner_user_id);

drop policy if exists "mcp_servers_update_own" on public.mcp_servers;
create policy "mcp_servers_update_own"
on public.mcp_servers
for update
to authenticated
using ((select auth.uid()) = owner_user_id)
with check ((select auth.uid()) = owner_user_id);

drop policy if exists "mcp_servers_delete_own" on public.mcp_servers;
create policy "mcp_servers_delete_own"
on public.mcp_servers
for delete
to authenticated
using ((select auth.uid()) = owner_user_id);

create table if not exists public.mcp_tools (
  id uuid primary key default gen_random_uuid(),
  server_id uuid not null references public.mcp_servers (id) on delete cascade,
  tool_name text not null,
  title text,
  description text,
  input_schema jsonb not null default '{}'::jsonb,
  output_schema jsonb not null default '{}'::jsonb,
  is_enabled boolean not null default true,
  rate_limit_per_minute integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mcp_tools_tool_name_length check (char_length(trim(tool_name)) between 1 and 140),
  constraint mcp_tools_rate_limit_check check (rate_limit_per_minute is null or rate_limit_per_minute > 0)
);

create unique index if not exists mcp_tools_server_tool_name_uidx
  on public.mcp_tools (server_id, tool_name);

create index if not exists mcp_tools_enabled_idx
  on public.mcp_tools (is_enabled, created_at desc);

drop trigger if exists set_mcp_tools_updated_at on public.mcp_tools;
create trigger set_mcp_tools_updated_at
before update on public.mcp_tools
for each row
execute function public.set_updated_at();

alter table public.mcp_tools enable row level security;

drop policy if exists "mcp_tools_select_visible" on public.mcp_tools;
create policy "mcp_tools_select_visible"
on public.mcp_tools
for select
to authenticated
using (
  exists (
    select 1
    from public.mcp_servers s
    where s.id = server_id
      and (
        (select auth.uid()) = s.owner_user_id
        or (s.owner_user_id is null and s.enabled = true)
      )
  )
);

drop policy if exists "mcp_tools_manage_own_servers" on public.mcp_tools;
create policy "mcp_tools_manage_own_servers"
on public.mcp_tools
for all
to authenticated
using (
  exists (
    select 1
    from public.mcp_servers s
    where s.id = server_id
      and s.owner_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.mcp_servers s
    where s.id = server_id
      and s.owner_user_id = (select auth.uid())
  )
);

create table if not exists public.mcp_tool_calls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  server_id uuid not null references public.mcp_servers (id) on delete cascade,
  tool_id uuid references public.mcp_tools (id) on delete set null,
  conversation_id text,
  request_id text,
  status text not null default 'queued',
  latency_ms integer,
  input_payload jsonb not null default '{}'::jsonb,
  output_payload jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  constraint mcp_tool_calls_status_check check (status in ('queued', 'running', 'success', 'error', 'timeout', 'cancelled')),
  constraint mcp_tool_calls_latency_check check (latency_ms is null or latency_ms >= 0)
);

create index if not exists mcp_tool_calls_user_created_idx
  on public.mcp_tool_calls (user_id, created_at desc);

create index if not exists mcp_tool_calls_status_created_idx
  on public.mcp_tool_calls (status, created_at desc);

create index if not exists mcp_tool_calls_server_tool_idx
  on public.mcp_tool_calls (server_id, tool_id, created_at desc);

alter table public.mcp_tool_calls enable row level security;

drop policy if exists "mcp_tool_calls_select_own" on public.mcp_tool_calls;
create policy "mcp_tool_calls_select_own"
on public.mcp_tool_calls
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "mcp_tool_calls_insert_own" on public.mcp_tool_calls;
create policy "mcp_tool_calls_insert_own"
on public.mcp_tool_calls
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "mcp_tool_calls_update_own" on public.mcp_tool_calls;
create policy "mcp_tool_calls_update_own"
on public.mcp_tool_calls
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "mcp_tool_calls_delete_own" on public.mcp_tool_calls;
create policy "mcp_tool_calls_delete_own"
on public.mcp_tool_calls
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- 5) Seed providers + extensions (idempotent)
-- ---------------------------------------------------------------------------
insert into public.api_providers (slug, name, auth_type, base_url, docs_url, is_active)
values
  ('openrouter', 'OpenRouter', 'api_key', 'https://openrouter.ai/api/v1', 'https://openrouter.ai/docs', true),
  ('claude', 'Claude (Anthropic)', 'api_key', 'https://api.anthropic.com', 'https://docs.anthropic.com', true),
  ('openai', 'OpenAI', 'api_key', 'https://api.openai.com/v1', 'https://platform.openai.com/docs', true),
  ('n8n', 'n8n', 'api_key', null, 'https://docs.n8n.io', true),
  ('supabase', 'Supabase', 'api_key', 'https://api.supabase.com', 'https://supabase.com/docs', true),
  ('github', 'GitHub', 'oauth2', 'https://api.github.com', 'https://docs.github.com/rest', true),
  ('google', 'Google', 'oauth2', 'https://www.googleapis.com', 'https://developers.google.com', true),
  ('figma', 'Figma', 'oauth2', 'https://api.figma.com', 'https://www.figma.com/developers/api', true),
  ('stripe', 'Stripe', 'api_key', 'https://api.stripe.com', 'https://docs.stripe.com/api', true),
  ('retell', 'Retell AI', 'api_key', 'https://api.retellai.com', 'https://docs.retellai.com', true)
on conflict (slug) do update
set
  name = excluded.name,
  auth_type = excluded.auth_type,
  base_url = excluded.base_url,
  docs_url = excluded.docs_url,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.extensions_catalog (slug, name, provider_id, category, icon, description, docs_url, is_active, sort_order)
select
  x.slug,
  x.name,
  p.id,
  x.category,
  x.icon,
  x.description,
  x.docs_url,
  true,
  x.sort_order
from (
  values
    ('openrouter', 'OpenRouter', 'openrouter', 'ai', 'logos:openrouter', 'Route AI prompts to OpenRouter models.', 'https://openrouter.ai/docs', 10),
    ('claude', 'Claude', 'claude', 'ai', 'simple-icons:anthropic', 'Use Claude models from Anthropic.', 'https://docs.anthropic.com', 20),
    ('openai', 'OpenAI', 'openai', 'ai', 'simple-icons:openai', 'Use OpenAI models and APIs.', 'https://platform.openai.com/docs', 30),
    ('n8n', 'n8n', 'n8n', 'automation', 'simple-icons:n8n', 'Automate workflows and webhooks.', 'https://docs.n8n.io', 40),
    ('supabase', 'Supabase', 'supabase', 'storage', 'simple-icons:supabase', 'Auth, DB, and storage backend.', 'https://supabase.com/docs', 50),
    ('github', 'GitHub', 'github', 'integration', 'simple-icons:github', 'Source control and PR workflows.', 'https://docs.github.com/rest', 60),
    ('google', 'Google Workspace', 'google', 'integration', 'simple-icons:google', 'Connect Gmail, Drive, and Calendar.', 'https://developers.google.com/workspace', 70),
    ('figma', 'Figma', 'figma', 'integration', 'simple-icons:figma', 'Design system and design-to-code context.', 'https://www.figma.com/developers/api', 80),
    ('stripe', 'Stripe', 'stripe', 'payments', 'simple-icons:stripe', 'Accept one-time template payments.', 'https://docs.stripe.com', 90),
    ('retell', 'Retell AI', 'retell', 'ai', 'lucide:phone-call', 'AI calling and booking assistant.', 'https://docs.retellai.com', 100)
) as x(slug, name, provider_slug, category, icon, description, docs_url, sort_order)
join public.api_providers p on p.slug = x.provider_slug
on conflict (slug) do update
set
  name = excluded.name,
  provider_id = excluded.provider_id,
  category = excluded.category,
  icon = excluded.icon,
  description = excluded.description,
  docs_url = excluded.docs_url,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order,
  updated_at = now();
