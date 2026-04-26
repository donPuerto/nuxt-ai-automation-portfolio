-- Bootstrap migration for environments where transcription tables were not created yet.
-- Safe to run multiple times.

create extension if not exists pgcrypto;

create table if not exists public.transcription_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  file_name text not null,
  mime_type text null,
  file_size_bytes bigint null,
  source_type text not null default 'upload',
  source_url text null,
  drive_file_id text null,
  drive_web_view_link text null,
  drive_download_link text null,
  drive_folder_id text null,
  status text not null default 'uploaded',
  transcriber text not null default 'assemblyai',
  transcription text null,
  summary text null,
  highlights jsonb not null default '[]'::jsonb,
  error_message text null,
  metadata jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null
);

create table if not exists public.transcription_runs (
  id uuid primary key default gen_random_uuid(),
  transcription_file_id uuid not null references public.transcription_files (id) on delete cascade,
  user_id uuid not null,
  job_id text not null,
  callback_url text null,
  transcriber text not null default 'assemblyai',
  status text not null default 'processing',
  source_url text null,
  started_at timestamptz null,
  finished_at timestamptz null,
  error_message text null,
  result_payload jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists transcription_runs_job_id_key
  on public.transcription_runs (job_id);

create index if not exists transcription_files_user_created_idx
  on public.transcription_files (user_id, created_at desc);

create index if not exists transcription_files_status_idx
  on public.transcription_files (status, created_at desc);

create index if not exists transcription_runs_user_created_idx
  on public.transcription_runs (user_id, created_at desc);

create or replace function public.set_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_transcription_files_updated_at on public.transcription_files;
create trigger set_transcription_files_updated_at
before update on public.transcription_files
for each row
execute function public.set_updated_at_column();

drop trigger if exists set_transcription_runs_updated_at on public.transcription_runs;
create trigger set_transcription_runs_updated_at
before update on public.transcription_runs
for each row
execute function public.set_updated_at_column();
