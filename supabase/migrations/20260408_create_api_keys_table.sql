create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  key_prefix text not null,
  key_hash text not null unique,
  scopes text[] not null default '{}'::text[],
  is_active boolean not null default true,
  last_used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint api_keys_name_length check (char_length(trim(name)) between 1 and 120),
  constraint api_keys_prefix_length check (char_length(trim(key_prefix)) between 4 and 24)
);

create index if not exists api_keys_user_id_idx
  on public.api_keys (user_id, created_at desc);

create index if not exists api_keys_active_idx
  on public.api_keys (is_active, expires_at);

create trigger set_api_keys_updated_at
before update on public.api_keys
for each row
execute function public.set_updated_at();

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
