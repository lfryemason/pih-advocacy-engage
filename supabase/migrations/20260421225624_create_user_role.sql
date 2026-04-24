-- Role enum: member < org_admin < super_admin
-- Named app_role (not user_role) so the user_role table below can use that name.
create type public.app_role as enum ('member', 'org_admin', 'super_admin');

-- One row per auth user storing their role and org. The org_id is a slug
-- (e.g. 'pihe') fed from the app-side PIHE_ORG_ID env var — there is no
-- organizations table. super_admin has no org (cross-org reach);
-- member/org_admin belong to exactly one org.
create table public.user_role (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'member',
  org_id text,
  constraint chk_role_org_alignment check (
    (role = 'super_admin' and org_id is null)
    or (role in ('member', 'org_admin') and org_id is not null)
  )
);

-- RLS helpers. SECURITY DEFINER bypasses RLS on user_role so policies
-- calling these helpers don't recurse.
create or replace function public.is_super_admin()
  returns boolean
  language sql
  stable
  security definer
  set search_path = public, pg_temp
  as $$
    select exists (
      select 1 from public.user_role
      where user_id = auth.uid() and role = 'super_admin'
    );
  $$;

create or replace function public.is_org_admin()
  returns boolean
  language sql
  stable
  security definer
  set search_path = public, pg_temp
  as $$
    select exists (
      select 1 from public.user_role
      where user_id = auth.uid() and role = 'org_admin'
    );
  $$;

revoke execute on function public.is_super_admin() from public;
revoke execute on function public.is_org_admin() from public;
grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.is_org_admin() to authenticated;

-- RLS: user_role
alter table public.user_role enable row level security;

-- Users read only their own role row. Super admins read all rows so they
-- can administer role assignments. This keeps the set of super_admin /
-- org_admin accounts from being enumerable by regular authenticated users.
create policy "users read own role"
  on public.user_role
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_super_admin());

create policy "super admins insert roles"
  on public.user_role
  for insert
  to authenticated
  with check (public.is_super_admin());

create policy "super admins update roles"
  on public.user_role
  for update
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "super admins delete roles"
  on public.user_role
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

-- Drop the jsonb org_links column (empty everywhere) in favor of a per-rep
-- row table that org admins can edit.
alter table public.representatives drop column org_links;

create table public.representative_org_info (
  representative_id uuid not null references public.representatives(id) on delete cascade,
  org_id text not null,
  links jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (representative_id, org_id)
);

create trigger rep_org_info_updated_at
  before update on public.representative_org_info
  for each row execute function public.handle_updated_at();

alter table public.representative_org_info enable row level security;

create policy "authenticated read rep org info"
  on public.representative_org_info
  for select
  to authenticated
  using (true);

create policy "org admins insert rep org info"
  on public.representative_org_info
  for insert
  to authenticated
  with check (public.is_org_admin() or public.is_super_admin());

create policy "org admins update rep org info"
  on public.representative_org_info
  for update
  to authenticated
  using (public.is_org_admin() or public.is_super_admin())
  with check (public.is_org_admin() or public.is_super_admin());

create policy "org admins delete rep org info"
  on public.representative_org_info
  for delete
  to authenticated
  using (public.is_org_admin() or public.is_super_admin());

-- Auto-assign new auth users as members of the default org. The 'pihe' slug
-- must match the app-side PIHE_ORG_ID env var; keep in sync if changed.
create or replace function public.handle_new_user()
  returns trigger
  language plpgsql
  security definer
  set search_path = public, pg_temp
  as $$
  begin
    insert into public.user_role (user_id, role, org_id)
      values (new.id, 'member', 'pihe')
      on conflict (user_id) do nothing;
    return new;
  end;
  $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
