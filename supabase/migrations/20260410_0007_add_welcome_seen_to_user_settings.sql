alter table public.user_settings
add column if not exists welcome_seen boolean not null default false;

update public.user_settings
set welcome_seen = false
where welcome_seen is null;
