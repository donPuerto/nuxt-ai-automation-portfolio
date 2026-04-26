alter table public.transcription_files
  add column if not exists current_job_id text null,
  add column if not exists callback_url text null,
  add column if not exists started_at timestamptz null,
  add column if not exists finished_at timestamptz null,
  add column if not exists result_payload jsonb null;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'transcription_runs'
  ) then
    with latest_runs as (
      select distinct on (transcription_file_id)
        transcription_file_id,
        job_id,
        callback_url,
        started_at,
        finished_at,
        result_payload
      from public.transcription_runs
      order by transcription_file_id, created_at desc
    )
    update public.transcription_files as files
    set
      current_job_id = latest_runs.job_id,
      callback_url = latest_runs.callback_url,
      started_at = latest_runs.started_at,
      finished_at = latest_runs.finished_at,
      result_payload = latest_runs.result_payload
    from latest_runs
    where files.id = latest_runs.transcription_file_id
      and (
        files.current_job_id is null
        or files.callback_url is null
        or files.started_at is null
        or files.finished_at is null
        or files.result_payload is null
      );
  end if;
end $$;

create unique index if not exists transcription_files_current_job_id_key
  on public.transcription_files (current_job_id)
  where current_job_id is not null;

drop index if exists public.transcription_files_drive_file_idx;

alter table public.transcription_files
  drop column if exists drive_file_id,
  drop column if exists drive_web_view_link,
  drop column if exists drive_download_link,
  drop column if exists drive_folder_id;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'transcription_runs'
  ) then
    drop policy if exists "transcription_runs_select_own" on public.transcription_runs;
    drop policy if exists "transcription_runs_insert_own" on public.transcription_runs;
    drop policy if exists "transcription_runs_update_own" on public.transcription_runs;
    drop policy if exists "transcription_runs_delete_own" on public.transcription_runs;

    drop trigger if exists set_transcription_runs_updated_at on public.transcription_runs;
  end if;
end $$;

drop table if exists public.transcription_runs;
