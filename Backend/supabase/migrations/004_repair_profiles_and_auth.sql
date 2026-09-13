-- Run this in the Supabase SQL editor after restoring a deleted profiles table.
-- It is safe to run more than once and preserves existing users.
do $$
begin
    create type public.user_role as enum ('admin', 'staff');
exception
    when duplicate_object then null;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    name text not null,
    role public.user_role not null default 'staff',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Recreate the timestamp trigger too when the table itself was removed.
drop trigger if exists profiles_updated on public.profiles;
create trigger profiles_updated
    before update on public.profiles
    for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, name, role)
    values (
        new.id,
        coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1), 'User'),
        'staff'
    )
    on conflict (id) do update set name = excluded.name;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_auth_user();

insert into public.profiles (id, name, role)
select
    u.id,
    coalesce(nullif(trim(u.raw_user_meta_data ->> 'name'), ''), split_part(u.email, '@', 1), 'User'),
    'staff'
from auth.users u
on conflict (id) do nothing;
