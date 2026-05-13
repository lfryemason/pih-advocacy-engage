create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  org_id text not null,
  email text not null,
  first_name text,
  last_name text,
  pronouns text,
  state text,
  congressional_district text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_org on public.profiles (org_id);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.profiles to service_role;

alter table public.profiles enable row level security;

create policy "members read own-org profiles"
  on public.profiles for select to authenticated
  using (public.is_in_org(org_id) or public.is_super_admin());

create policy "users update own profile"
  on public.profiles for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Extend handle_new_user to also insert a profiles row.
-- user_role is inserted first; we read org_id back from that row.
create or replace function public.handle_new_user()
  returns trigger
  language plpgsql
  security definer
  set search_path = public, pg_temp
  as $$
  declare
    new_org_id text;
  begin
    insert into public.user_role (user_id, role, org_id)
      values (new.id, 'member', 'pihe')
      on conflict (user_id) do nothing
      returning org_id into new_org_id;

    -- on conflict the returning clause yields no row; look it up instead
    if new_org_id is null then
      select org_id into new_org_id
        from public.user_role where user_id = new.id;
    end if;

    -- only create a profile if we have an org (super_admins have null org_id
    -- and are excluded here intentionally)
    if new_org_id is not null then
      insert into public.profiles (
        user_id, org_id, email,
        first_name, last_name, pronouns, state, congressional_district
      )
      values (
        new.id,
        new_org_id,
        new.email,
        new.raw_user_meta_data->>'first_name',
        new.raw_user_meta_data->>'last_name',
        new.raw_user_meta_data->>'pronouns',
        new.raw_user_meta_data->>'state',
        new.raw_user_meta_data->>'congressional_district'
      )
      on conflict (user_id) do nothing;
    end if;

    return new;
  end;
  $$;

-- Backfill profiles for all existing users that belong to an org.
-- Super_admins (org_id is null) are intentionally skipped.
insert into public.profiles (
  user_id, org_id, email,
  first_name, last_name, pronouns, state, congressional_district
)
select
  u.id,
  ur.org_id,
  u.email,
  u.raw_user_meta_data->>'first_name',
  u.raw_user_meta_data->>'last_name',
  u.raw_user_meta_data->>'pronouns',
  u.raw_user_meta_data->>'state',
  u.raw_user_meta_data->>'congressional_district'
from auth.users u
join public.user_role ur on ur.user_id = u.id
where ur.org_id is not null
on conflict (user_id) do nothing;
