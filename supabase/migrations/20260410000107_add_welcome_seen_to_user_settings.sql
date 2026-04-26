alter table public.user_settings
add column if not exists welcome_seen boolean not null default false;

update public.user_settings
set welcome_seen = false
where welcome_seen is null;

alter table public.user_settings
add column if not exists agent_provider text not null default 'openrouter',
add column if not exists agent_model text not null default 'openrouter-free';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_settings_agent_provider_check'
      and conrelid = 'public.user_settings'::regclass
  ) then
    alter table public.user_settings
    add constraint user_settings_agent_provider_check
    check (agent_provider in ('openrouter', 'claude', 'openai'));
  end if;
end $$;
