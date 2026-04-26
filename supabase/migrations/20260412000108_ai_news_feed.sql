-- AI news feed tables for the portfolio header ticker

create table if not exists public.ai_news_feed (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  source_label text,
  summary text,
  provider text not null default 'claude',
  is_active boolean not null default true,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_news_feed_title_length check (char_length(trim(title)) between 1 and 180),
  constraint ai_news_feed_url_length check (char_length(trim(url)) between 1 and 2048),
  constraint ai_news_feed_provider_check check (provider in ('claude', 'openai', 'openrouter', 'general'))
);

create table if not exists public.ai_news_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete cascade,
  enabled boolean not null default true,
  default_count integer not null default 20,
  provider_filter text not null default 'claude',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_news_settings_default_count_check check (default_count between 1 and 25),
  constraint ai_news_settings_provider_filter_check check (provider_filter in ('claude', 'openai', 'openrouter', 'general'))
);

create unique index if not exists ai_news_settings_user_unique_idx
  on public.ai_news_settings (user_id)
  where user_id is not null;

create index if not exists ai_news_feed_provider_active_idx
  on public.ai_news_feed (provider, is_active, published_at desc nulls last);

create index if not exists ai_news_feed_active_idx
  on public.ai_news_feed (is_active, published_at desc nulls last);

drop trigger if exists set_ai_news_feed_updated_at on public.ai_news_feed;
create trigger set_ai_news_feed_updated_at
before update on public.ai_news_feed
for each row
execute function public.set_updated_at();

drop trigger if exists set_ai_news_settings_updated_at on public.ai_news_settings;
create trigger set_ai_news_settings_updated_at
before update on public.ai_news_settings
for each row
execute function public.set_updated_at();

alter table public.ai_news_feed enable row level security;
alter table public.ai_news_settings enable row level security;

drop policy if exists "ai_news_feed_select_all" on public.ai_news_feed;
create policy "ai_news_feed_select_all"
on public.ai_news_feed
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "ai_news_feed_manage_authenticated" on public.ai_news_feed;
create policy "ai_news_feed_manage_authenticated"
on public.ai_news_feed
for all
to authenticated
using (exists (
  select 1
  from public.profiles p
  where p.id = (select auth.uid())
))
with check (exists (
  select 1
  from public.profiles p
  where p.id = (select auth.uid())
));

drop policy if exists "ai_news_settings_select_own" on public.ai_news_settings;
create policy "ai_news_settings_select_own"
on public.ai_news_settings
for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "ai_news_settings_insert_own" on public.ai_news_settings;
create policy "ai_news_settings_insert_own"
on public.ai_news_settings
for insert
to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists "ai_news_settings_update_own" on public.ai_news_settings;
create policy "ai_news_settings_update_own"
on public.ai_news_settings
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "ai_news_settings_delete_own" on public.ai_news_settings;
create policy "ai_news_settings_delete_own"
on public.ai_news_settings
for delete
to authenticated
using (user_id = (select auth.uid()));
