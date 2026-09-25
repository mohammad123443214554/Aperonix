-- Aperonix account system database migration
-- Run this once in Supabase SQL Editor after the existing chat tables are present.

alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists date_of_birth date,
  add column if not exists gender text,
  add column if not exists email text,
  add column if not exists phone_country_code text,
  add column if not exists phone_number text;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  full_name text := coalesce(metadata->>'full_name', metadata->>'name', '');
  name_parts text[];
begin
  name_parts := regexp_split_to_array(trim(full_name), '\s+');

  insert into public.profiles (
    id,
    first_name,
    last_name,
    date_of_birth,
    gender,
    email,
    phone_country_code,
    phone_number,
    avatar_url
  )
  values (
    new.id,
    nullif(metadata->>'first_name', ''),
    nullif(metadata->>'last_name', ''),
    case
      when nullif(metadata->>'date_of_birth', '') is not null
        then (metadata->>'date_of_birth')::date
      else null
    end,
    nullif(metadata->>'gender', ''),
    new.email,
    nullif(metadata->>'phone_country_code', ''),
    nullif(metadata->>'phone_number', ''),
    nullif(metadata->>'avatar_url', '')
  )
  on conflict (id) do update
  set
    first_name = coalesce(excluded.first_name, public.profiles.first_name),
    last_name = coalesce(excluded.last_name, public.profiles.last_name),
    date_of_birth = coalesce(excluded.date_of_birth, public.profiles.date_of_birth),
    gender = coalesce(excluded.gender, public.profiles.gender),
    email = coalesce(excluded.email, public.profiles.email),
    phone_country_code = coalesce(excluded.phone_country_code, public.profiles.phone_country_code),
    phone_number = coalesce(excluded.phone_number, public.profiles.phone_number),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_auth_user();

-- Keep the profile timestamp fresh whenever it is edited.
create or replace function public.set_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute procedure public.set_profile_updated_at();
