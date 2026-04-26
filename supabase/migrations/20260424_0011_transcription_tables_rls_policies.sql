-- Ensure transcription tables are usable with RLS enabled.
-- Safe to run repeatedly.

alter table if exists public.transcription_files enable row level security;
alter table if exists public.transcription_runs enable row level security;

grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on table public.transcription_files to authenticated, service_role;
grant select, insert, update, delete on table public.transcription_runs to authenticated, service_role;

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
