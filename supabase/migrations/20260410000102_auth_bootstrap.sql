-- Auto-bootstrap profile + settings for new auth users.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _full_name text;
  _first_name text;
  _last_name text;
  _nickname text;
  _avatar_url text;
  _email text;
  _name_parts text[];
begin
  _email := nullif(trim(coalesce(new.email, new.raw_user_meta_data ->> 'email')), '');
  _full_name := nullif(trim(coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'user_name',
    new.raw_user_meta_data ->> 'preferred_username'
  )), '');

  _first_name := nullif(trim(coalesce(
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'given_name'
  )), '');

  _last_name := nullif(trim(coalesce(
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'family_name'
  )), '');

  if (_first_name is null or _last_name is null) and _full_name is not null then
    _name_parts := regexp_split_to_array(_full_name, '\s+');

    if _first_name is null then
      _first_name := _name_parts[1];
    end if;

    if _last_name is null and array_length(_name_parts, 1) > 1 then
      _last_name := array_to_string(_name_parts[2:array_length(_name_parts, 1)], ' ');
    end if;
  end if;

  _nickname := nullif(trim(coalesce(
    new.raw_user_meta_data ->> 'nickname',
    new.raw_user_meta_data ->> 'user_name',
    new.raw_user_meta_data ->> 'preferred_username',
    _full_name,
    split_part(coalesce(_email, ''), '@', 1)
  )), '');

  _avatar_url := nullif(trim(coalesce(
    new.raw_user_meta_data ->> 'avatar_url',
    new.raw_user_meta_data ->> 'picture'
  )), '');

  insert into public.profiles (
    id,
    first_name,
    last_name,
    nickname,
    email,
    avatar_url
  )
  values (
    new.id,
    _first_name,
    _last_name,
    _nickname,
    _email,
    _avatar_url
  )
  on conflict (id) do update
  set
    first_name = coalesce(nullif(public.profiles.first_name, ''), excluded.first_name),
    last_name = coalesce(nullif(public.profiles.last_name, ''), excluded.last_name),
    nickname = coalesce(nullif(public.profiles.nickname, ''), excluded.nickname),
    email = coalesce(excluded.email, public.profiles.email),
    avatar_url = coalesce(nullif(public.profiles.avatar_url, ''), excluded.avatar_url);

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();

create or replace function public.handle_auth_user_email_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles
    set email = new.email
    where id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
after update of email on auth.users
for each row
execute function public.handle_auth_user_email_update();

insert into public.profiles (
  id,
  first_name,
  last_name,
  nickname,
  email,
  avatar_url
)
select
  users.id,
  coalesce(
    nullif(trim(users.raw_user_meta_data ->> 'first_name'), ''),
    nullif(trim(users.raw_user_meta_data ->> 'given_name'), ''),
    nullif(split_part(trim(coalesce(users.raw_user_meta_data ->> 'full_name', users.raw_user_meta_data ->> 'name', '')), ' ', 1), '')
  ) as first_name,
  coalesce(
    nullif(trim(users.raw_user_meta_data ->> 'last_name'), ''),
    nullif(trim(users.raw_user_meta_data ->> 'family_name'), ''),
    nullif(regexp_replace(trim(coalesce(users.raw_user_meta_data ->> 'full_name', users.raw_user_meta_data ->> 'name', '')), '^\S+\s*', ''), '')
  ) as last_name,
  coalesce(
    nullif(trim(users.raw_user_meta_data ->> 'nickname'), ''),
    nullif(trim(users.raw_user_meta_data ->> 'user_name'), ''),
    nullif(trim(users.raw_user_meta_data ->> 'preferred_username'), ''),
    nullif(trim(coalesce(users.raw_user_meta_data ->> 'full_name', users.raw_user_meta_data ->> 'name')), ''),
    nullif(split_part(coalesce(users.email, users.raw_user_meta_data ->> 'email', ''), '@', 1), '')
  ) as nickname,
  nullif(trim(coalesce(users.email, users.raw_user_meta_data ->> 'email')), '') as email,
  nullif(trim(coalesce(users.raw_user_meta_data ->> 'avatar_url', users.raw_user_meta_data ->> 'picture')), '') as avatar_url
from auth.users as users
on conflict (id) do update
set
  first_name = coalesce(nullif(public.profiles.first_name, ''), excluded.first_name),
  last_name = coalesce(nullif(public.profiles.last_name, ''), excluded.last_name),
  nickname = coalesce(nullif(public.profiles.nickname, ''), excluded.nickname),
  email = coalesce(excluded.email, public.profiles.email),
  avatar_url = coalesce(nullif(public.profiles.avatar_url, ''), excluded.avatar_url);

insert into public.user_settings (user_id)
select id
from auth.users
on conflict (user_id) do nothing;
