-- Transcription uploads + runs (for Google Drive-backed file transcription)

create table if not exists public.transcription_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  file_name text not null,
  mime_type text,
  file_size_bytes bigint,
  source_type text not null default 'upload',
  source_url text,
  drive_file_id text,
  drive_web_view_link text,
  drive_download_link text,
  drive_folder_id text,
  status text not null default 'uploaded',
  transcriber text not null default 'deepgram',
  transcription text,
  summary text,
  highlights jsonb not null default '[]'::jsonb,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint transcription_files_file_name_length check (char_length(trim(file_name)) between 1 and 260),
  constraint transcription_files_size_check check (file_size_bytes is null or file_size_bytes >= 0),
  constraint transcription_files_source_type_check check (source_type in ('upload', 'youtube', 'gdrive', 'social', 'url')),
  constraint transcription_files_status_check check (status in ('uploaded', 'queued', 'processing', 'completed', 'failed', 'cancelled', 'deleted')),
  constraint transcription_files_transcriber_check check (transcriber in ('assemblyai', 'deepgram', 'whisper')),
  constraint transcription_files_highlights_array_check check (jsonb_typeof(highlights) = 'array')
);

create table if not exists public.transcription_runs (
  id uuid primary key default gen_random_uuid(),
  transcription_file_id uuid not null references public.transcription_files (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  job_id text not null,
  callback_url text,
  transcriber text not null default 'deepgram',
  status text not null default 'queued',
  source_url text,
  started_at timestamptz,
  finished_at timestamptz,
  error_message text,
  result_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transcription_runs_job_id_length check (char_length(trim(job_id)) between 1 and 200),
  constraint transcription_runs_transcriber_check check (transcriber in ('assemblyai', 'deepgram', 'whisper')),
  constraint transcription_runs_status_check check (status in ('queued', 'processing', 'completed', 'failed', 'cancelled'))
);

create unique index if not exists transcription_runs_job_id_unique_idx
  on public.transcription_runs (job_id);

create index if not exists transcription_files_user_status_created_idx
  on public.transcription_files (user_id, status, created_at desc);

create index if not exists transcription_files_user_created_idx
  on public.transcription_files (user_id, created_at desc);

create index if not exists transcription_files_drive_file_idx
  on public.transcription_files (drive_file_id)
  where drive_file_id is not null and deleted_at is null;

create index if not exists transcription_runs_file_created_idx
  on public.transcription_runs (transcription_file_id, created_at desc);

create index if not exists transcription_runs_user_created_idx
  on public.transcription_runs (user_id, created_at desc);

drop trigger if exists set_transcription_files_updated_at on public.transcription_files;
create trigger set_transcription_files_updated_at
before update on public.transcription_files
for each row
execute function public.set_updated_at();

drop trigger if exists set_transcription_runs_updated_at on public.transcription_runs;
create trigger set_transcription_runs_updated_at
before update on public.transcription_runs
for each row
execute function public.set_updated_at();

alter table public.transcription_files enable row level security;
alter table public.transcription_runs enable row level security;

drop policy if exists "transcription_files_select_own" on public.transcription_files;
create policy "transcription_files_select_own"
on public.transcription_files
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "transcription_files_insert_own" on public.transcription_files;
create policy "transcription_files_insert_own"
on public.transcription_files
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "transcription_files_update_own" on public.transcription_files;
create policy "transcription_files_update_own"
on public.transcription_files
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "transcription_files_delete_own" on public.transcription_files;
create policy "transcription_files_delete_own"
on public.transcription_files
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "transcription_runs_select_own" on public.transcription_runs;
create policy "transcription_runs_select_own"
on public.transcription_runs
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "transcription_runs_insert_own" on public.transcription_runs;
create policy "transcription_runs_insert_own"
on public.transcription_runs
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.transcription_files f
    where f.id = transcription_file_id
      and f.user_id = (select auth.uid())
  )
);

drop policy if exists "transcription_runs_update_own" on public.transcription_runs;
create policy "transcription_runs_update_own"
on public.transcription_runs
for update
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.transcription_files f
    where f.id = transcription_file_id
      and f.user_id = (select auth.uid())
  )
);

drop policy if exists "transcription_runs_delete_own" on public.transcription_runs;
create policy "transcription_runs_delete_own"
on public.transcription_runs
for delete
to authenticated
using ((select auth.uid()) = user_id);
