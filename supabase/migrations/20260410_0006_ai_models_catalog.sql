-- AI model catalog + sync history + per-user visibility controls

create table if not exists public.ai_models_catalog (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  model_id text not null,
  label text not null,
  description text,
  is_free boolean not null default false,
  is_active boolean not null default true,
  is_displayable boolean not null default true,
  is_deprecated boolean not null default false,
  is_obsolete boolean not null default false,
  release_date date,
  input_price numeric(14, 8),
  output_price numeric(14, 8),
  context_window integer,
  max_output_tokens integer,
  capabilities jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_models_provider_check check (provider in ('openrouter', 'claude', 'openai')),
  constraint ai_models_label_length check (char_length(trim(label)) between 1 and 180),
  constraint ai_models_price_input_check check (input_price is null or input_price >= 0),
  constraint ai_models_price_output_check check (output_price is null or output_price >= 0),
  constraint ai_models_context_window_check check (context_window is null or context_window > 0),
  constraint ai_models_max_output_tokens_check check (max_output_tokens is null or max_output_tokens > 0),
  constraint ai_models_provider_model_unique unique (provider, model_id)
);

alter table public.ai_models_catalog
  add column if not exists is_obsolete boolean not null default false,
  add column if not exists release_date date;

create index if not exists ai_models_display_idx
  on public.ai_models_catalog (provider, is_active, is_displayable, is_obsolete, is_free, updated_at desc);

create index if not exists ai_models_last_seen_idx
  on public.ai_models_catalog (provider, last_seen_at desc);

create index if not exists ai_models_release_date_idx
  on public.ai_models_catalog (provider, release_date desc nulls last);

drop trigger if exists set_ai_models_catalog_updated_at on public.ai_models_catalog;
create trigger set_ai_models_catalog_updated_at
before update on public.ai_models_catalog
for each row
execute function public.set_updated_at();

alter table public.ai_models_catalog enable row level security;

drop policy if exists "ai_models_catalog_select_displayable" on public.ai_models_catalog;
create policy "ai_models_catalog_select_displayable"
on public.ai_models_catalog
for select
to anon, authenticated
using (is_active = true and is_displayable = true and is_obsolete = false);

grant select on public.ai_models_catalog to anon, authenticated;
grant select, insert, update, delete on public.ai_models_catalog to service_role;

create table if not exists public.ai_model_sync_runs (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  status text not null default 'running',
  fetched_count integer not null default 0,
  upserted_count integer not null default 0,
  hidden_count integer not null default 0,
  source text,
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  constraint ai_model_sync_runs_provider_check check (provider in ('openrouter', 'claude', 'openai')),
  constraint ai_model_sync_runs_status_check check (status in ('running', 'success', 'error'))
);

create index if not exists ai_model_sync_runs_provider_started_idx
  on public.ai_model_sync_runs (provider, started_at desc);

alter table public.ai_model_sync_runs enable row level security;

drop policy if exists "ai_model_sync_runs_read_auth" on public.ai_model_sync_runs;
create policy "ai_model_sync_runs_read_auth"
on public.ai_model_sync_runs
for select
to authenticated
using (true);

grant select on public.ai_model_sync_runs to authenticated;
grant select, insert, update, delete on public.ai_model_sync_runs to service_role;

create table if not exists public.user_model_visibility (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  model_id uuid not null references public.ai_models_catalog (id) on delete cascade,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_model_visibility_unique unique (user_id, model_id)
);

create index if not exists user_model_visibility_user_idx
  on public.user_model_visibility (user_id, is_hidden);

drop trigger if exists set_user_model_visibility_updated_at on public.user_model_visibility;
create trigger set_user_model_visibility_updated_at
before update on public.user_model_visibility
for each row
execute function public.set_updated_at();

alter table public.user_model_visibility enable row level security;

drop policy if exists "user_model_visibility_select_own" on public.user_model_visibility;
create policy "user_model_visibility_select_own"
on public.user_model_visibility
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "user_model_visibility_insert_own" on public.user_model_visibility;
create policy "user_model_visibility_insert_own"
on public.user_model_visibility
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "user_model_visibility_update_own" on public.user_model_visibility;
create policy "user_model_visibility_update_own"
on public.user_model_visibility
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "user_model_visibility_delete_own" on public.user_model_visibility;
create policy "user_model_visibility_delete_own"
on public.user_model_visibility
for delete
to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.user_model_visibility to authenticated;
grant select, insert, update, delete on public.user_model_visibility to service_role;

-- Initial seed so UI has defaults before first sync
insert into public.ai_models_catalog (
  provider,
  model_id,
  label,
  description,
  is_free,
  is_active,
  is_displayable,
  is_deprecated,
  is_obsolete,
  input_price,
  output_price
)
values
  ('openrouter', 'openrouter-free', 'OpenRouter (Free models)', 'Dynamic free model routing via OpenRouter.', true, true, true, false, false, 0, 0),
  ('claude', 'claude-sonnet-4-5', 'Claude Sonnet 4.5', 'Claude Sonnet 4.5 default model.', false, true, true, false, false, 0.000003, 0.000015),
  ('openai', 'openai-gpt-4-1-mini', 'OpenAI GPT-4.1 mini', 'OpenAI GPT-4.1 mini default model.', false, true, true, false, false, 0.0000004, 0.0000016)
on conflict (provider, model_id) do update
set
  label = excluded.label,
  description = excluded.description,
  is_free = excluded.is_free,
  is_active = excluded.is_active,
  is_displayable = excluded.is_displayable,
  is_deprecated = excluded.is_deprecated,
  is_obsolete = excluded.is_obsolete,
  input_price = excluded.input_price,
  output_price = excluded.output_price,
  last_seen_at = now(),
  updated_at = now();
