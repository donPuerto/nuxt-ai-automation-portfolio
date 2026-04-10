-- Chat persistence schema (chats, messages, saved prompts)

create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text,
  summary text,
  agent_provider text not null default 'openrouter',
  agent_model text not null default 'openrouter-free',
  status text not null default 'active',
  pinned boolean not null default false,
  archived_at timestamptz,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chats_agent_provider_check check (agent_provider in ('openrouter', 'claude', 'openai')),
  constraint chats_status_check check (status in ('active', 'archived')),
  constraint chats_title_length check (title is null or char_length(trim(title)) between 1 and 240)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null,
  content text not null,
  content_format text not null default 'markdown',
  metadata jsonb not null default '{}'::jsonb,
  token_input integer,
  token_output integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  edited_at timestamptz,
  constraint messages_role_check check (role in ('system', 'user', 'assistant', 'tool')),
  constraint messages_content_format_check check (content_format in ('markdown', 'text', 'json')),
  constraint messages_token_input_check check (token_input is null or token_input >= 0),
  constraint messages_token_output_check check (token_output is null or token_output >= 0)
);

create table if not exists public.saved_prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  label text not null,
  prompt text not null,
  tags text[] not null default '{}'::text[],
  is_favorite boolean not null default false,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint saved_prompts_label_length check (char_length(trim(label)) between 1 and 120),
  constraint saved_prompts_prompt_length check (char_length(trim(prompt)) between 1 and 12000)
);

create index if not exists chats_user_id_created_idx
  on public.chats (user_id, created_at desc);

create index if not exists chats_user_last_message_idx
  on public.chats (user_id, last_message_at desc);

create index if not exists messages_chat_id_created_idx
  on public.messages (chat_id, created_at asc);

create index if not exists messages_user_created_idx
  on public.messages (user_id, created_at desc);

create index if not exists saved_prompts_user_created_idx
  on public.saved_prompts (user_id, created_at desc);

drop trigger if exists set_chats_updated_at on public.chats;
create trigger set_chats_updated_at
before update on public.chats
for each row
execute function public.set_updated_at();

drop trigger if exists set_messages_updated_at on public.messages;
create trigger set_messages_updated_at
before update on public.messages
for each row
execute function public.set_updated_at();

drop trigger if exists set_saved_prompts_updated_at on public.saved_prompts;
create trigger set_saved_prompts_updated_at
before update on public.saved_prompts
for each row
execute function public.set_updated_at();

create or replace function public.touch_chat_last_message_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  update public.chats
  set last_message_at = new.created_at
  where id = new.chat_id;

  return new;
end;
$$;

drop trigger if exists set_chats_last_message_at on public.messages;
create trigger set_chats_last_message_at
after insert on public.messages
for each row
execute function public.touch_chat_last_message_at();

alter table public.chats enable row level security;
alter table public.messages enable row level security;
alter table public.saved_prompts enable row level security;

drop policy if exists "chats_select_own" on public.chats;
create policy "chats_select_own"
on public.chats
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "chats_insert_own" on public.chats;
create policy "chats_insert_own"
on public.chats
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "chats_update_own" on public.chats;
create policy "chats_update_own"
on public.chats
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "chats_delete_own" on public.chats;
create policy "chats_delete_own"
on public.chats
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "messages_select_own_chat" on public.messages;
create policy "messages_select_own_chat"
on public.messages
for select
to authenticated
using (
  exists (
    select 1
    from public.chats c
    where c.id = chat_id
      and c.user_id = (select auth.uid())
  )
);

drop policy if exists "messages_insert_own_chat" on public.messages;
create policy "messages_insert_own_chat"
on public.messages
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.chats c
    where c.id = chat_id
      and c.user_id = (select auth.uid())
  )
);

drop policy if exists "messages_update_own_chat" on public.messages;
create policy "messages_update_own_chat"
on public.messages
for update
to authenticated
using (
  exists (
    select 1
    from public.chats c
    where c.id = chat_id
      and c.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.chats c
    where c.id = chat_id
      and c.user_id = (select auth.uid())
  )
);

drop policy if exists "messages_delete_own_chat" on public.messages;
create policy "messages_delete_own_chat"
on public.messages
for delete
to authenticated
using (
  exists (
    select 1
    from public.chats c
    where c.id = chat_id
      and c.user_id = (select auth.uid())
  )
);

drop policy if exists "saved_prompts_select_own" on public.saved_prompts;
create policy "saved_prompts_select_own"
on public.saved_prompts
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "saved_prompts_insert_own" on public.saved_prompts;
create policy "saved_prompts_insert_own"
on public.saved_prompts
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "saved_prompts_update_own" on public.saved_prompts;
create policy "saved_prompts_update_own"
on public.saved_prompts
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "saved_prompts_delete_own" on public.saved_prompts;
create policy "saved_prompts_delete_own"
on public.saved_prompts
for delete
to authenticated
using ((select auth.uid()) = user_id);
