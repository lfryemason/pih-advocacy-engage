-- Role enum: member < org_admin < super_admin
create type public.user_role as enum ('member', 'org_admin', 'super_admin');

-- Organizations that users can belong to
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger organizations_updated_at
  before update on public.organizations
  for each row execute function public.handle_updated_at();

insert into public.organizations (slug, name)
  values ('pihe', 'Partners in Health Engage');

-- One profile row per auth user; exactly one org except for super_admin
create table public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'member',
  org_id uuid references public.organizations(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_role_org_alignment check (
    (role = 'super_admin' and org_id is null)
    or (role in ('member', 'org_admin') and org_id is not null)
  )
);

create index idx_user_profiles_org_id on public.user_profiles (org_id);
create index idx_user_profiles_role on public.user_profiles (role);

create trigger user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.handle_updated_at();

-- RLS helpers. SECURITY DEFINER bypasses RLS on user_profiles so policies
-- calling these helpers don't recurse.
create or replace function public.current_org_id()
  returns uuid
  language sql
  stable
  security definer
  set search_path = public, pg_temp
  as $$
    select org_id from public.user_profiles where user_id = auth.uid();
  $$;

create or replace function public.is_super_admin()
  returns boolean
  language sql
  stable
  security definer
  set search_path = public, pg_temp
  as $$
    select exists (
      select 1 from public.user_profiles
      where user_id = auth.uid() and role = 'super_admin'
    );
  $$;

create or replace function public.is_org_admin_of(target_org uuid)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public, pg_temp
  as $$
    select exists (
      select 1 from public.user_profiles
      where user_id = auth.uid()
        and role = 'org_admin'
        and org_id = target_org
    );
  $$;

revoke execute on function public.current_org_id() from public;
revoke execute on function public.is_super_admin() from public;
revoke execute on function public.is_org_admin_of(uuid) from public;
grant execute on function public.current_org_id() to authenticated;
grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.is_org_admin_of(uuid) to authenticated;

-- RLS: user_profiles
alter table public.user_profiles enable row level security;

create policy "users read own or same-org profiles"
  on public.user_profiles
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or (org_id is not null and org_id = public.current_org_id())
    or public.is_super_admin()
  );

create policy "super admins insert profiles"
  on public.user_profiles
  for insert
  to authenticated
  with check (public.is_super_admin());

create policy "super admins update profiles"
  on public.user_profiles
  for update
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "super admins delete profiles"
  on public.user_profiles
  for delete
  to authenticated
  using (public.is_super_admin());

-- RLS: organizations (members only see their own org)
alter table public.organizations enable row level security;

create policy "members read own org"
  on public.organizations
  for select
  to authenticated
  using (id = public.current_org_id() or public.is_super_admin());

create policy "super admins insert orgs"
  on public.organizations
  for insert
  to authenticated
  with check (public.is_super_admin());

create policy "super admins update orgs"
  on public.organizations
  for update
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "super admins delete orgs"
  on public.organizations
  for delete
  to authenticated
  using (public.is_super_admin());

-- representatives: super-admin-only writes (reads already open to authenticated)
create policy "super admins insert representatives"
  on public.representatives
  for insert
  to authenticated
  with check (public.is_super_admin());

create policy "super admins update representatives"
  on public.representatives
  for update
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "super admins delete representatives"
  on public.representatives
  for delete
  to authenticated
  using (public.is_super_admin());

-- Drop the jsonb org_links column (empty everywhere) in favor of a per-org
-- row table that can be RLS-scoped per org.
alter table public.representatives drop column org_links;

create table public.representative_org_links (
  id uuid primary key default gen_random_uuid(),
  representative_id uuid not null references public.representatives(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  links jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (representative_id, org_id)
);

create index idx_rep_org_links_rep_id on public.representative_org_links (representative_id);
create index idx_rep_org_links_org_id on public.representative_org_links (org_id);

create trigger rep_org_links_updated_at
  before update on public.representative_org_links
  for each row execute function public.handle_updated_at();

alter table public.representative_org_links enable row level security;

create policy "members read own-org representative links"
  on public.representative_org_links
  for select
  to authenticated
  using (org_id = public.current_org_id() or public.is_super_admin());

create policy "org admins insert own-org representative links"
  on public.representative_org_links
  for insert
  to authenticated
  with check (
    public.is_org_admin_of(org_id) or public.is_super_admin()
  );

create policy "org admins update own-org representative links"
  on public.representative_org_links
  for update
  to authenticated
  using (public.is_org_admin_of(org_id) or public.is_super_admin())
  with check (public.is_org_admin_of(org_id) or public.is_super_admin());

create policy "org admins delete own-org representative links"
  on public.representative_org_links
  for delete
  to authenticated
  using (public.is_org_admin_of(org_id) or public.is_super_admin());

-- Auto-assign new auth users to the default pihe org as members
create or replace function public.handle_new_user()
  returns trigger
  language plpgsql
  security definer
  set search_path = public, pg_temp
  as $$
  declare
    v_org_id uuid;
  begin
    select id into v_org_id from public.organizations where slug = 'pihe';
    if v_org_id is null then
      raise exception 'default org pihe missing';
    end if;
    insert into public.user_profiles (user_id, role, org_id)
      values (new.id, 'member', v_org_id)
      on conflict (user_id) do nothing;
    return new;
  end;
  $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
