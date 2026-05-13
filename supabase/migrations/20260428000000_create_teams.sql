create table public.teams (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  name text not null,
  slug text not null,
  state text not null,
  type text not null check (type in ('high_school', 'university', 'city')),
  description text,
  founded_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, slug)
);

create trigger teams_updated_at
  before update on public.teams
  for each row execute function public.handle_updated_at();

create or replace function public.teams_set_slug()
  returns trigger
  language plpgsql
  as $$
  declare
    base text;
    candidate text;
    n int := 1;
  begin
    base := lower(new.name);
    base := regexp_replace(base, '[^a-z0-9]+', '-', 'g');
    base := regexp_replace(base, '(^-+|-+$)', '', 'g');
    if base = '' then
      base := 'team';
    end if;

    candidate := base;
    while exists (
      select 1 from public.teams
       where org_id = new.org_id and slug = candidate
    ) loop
      n := n + 1;
      candidate := base || '-' || n;
    end loop;

    new.slug := candidate;
    return new;
  end;
  $$;

create trigger teams_set_slug_before_insert
  before insert on public.teams
  for each row execute function public.teams_set_slug();

create table public.team_memberships (
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  org_id text not null,
  role text not null check (role in ('member', 'team_lead', 'fundraising_lead', 'advocacy_lead')),
  created_at timestamptz not null default now(),
  primary key (team_id, user_id, role)
);

-- FK to profiles so PostgREST can join them in a single query.
alter table public.team_memberships
  add constraint team_memberships_user_id_profiles_fkey
  foreign key (user_id) references public.profiles(user_id) on delete cascade;

create index idx_team_memberships_team on public.team_memberships (team_id);
create index idx_team_memberships_user on public.team_memberships (user_id);
create index idx_team_memberships_org  on public.team_memberships (org_id);

-- Atomic role change: insert new row + delete old row in one transaction.
-- SECURITY DEFINER so it can bypass RLS; authorization is enforced manually.
create or replace function public.change_member_role(
  p_team_id uuid,
  p_user_id uuid,
  p_old_role text,
  p_new_role text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_new_role not in ('member', 'team_lead', 'fundraising_lead', 'advocacy_lead') then
    raise exception 'invalid role: %', p_new_role;
  end if;

  -- Caller must be a team member, org admin, or super admin.
  if not (
    exists (
      select 1 from public.team_memberships tm
      where tm.team_id = p_team_id and tm.user_id = auth.uid()
    )
    or public.is_org_admin_for((select org_id from public.teams where id = p_team_id))
    or public.is_super_admin()
  ) then
    raise exception 'permission denied';
  end if;

  -- Verify the old role actually exists for this user to prevent phantom-role injection.
  if not exists (
    select 1 from public.team_memberships
    where team_id = p_team_id and user_id = p_user_id and role = p_old_role
  ) then
    raise exception 'role not found';
  end if;

  insert into public.team_memberships (team_id, user_id, org_id, role)
  select p_team_id, p_user_id, t.org_id, p_new_role
  from public.teams t where t.id = p_team_id;

  delete from public.team_memberships
  where team_id = p_team_id
    and user_id = p_user_id
    and role = p_old_role;
end;
$$;

grant execute on function public.change_member_role to authenticated;

grant select, insert, update, delete on public.teams to authenticated;
grant select, insert, update, delete on public.teams to service_role;
grant select, insert, update, delete on public.team_memberships to authenticated;
grant select, insert, update, delete on public.team_memberships to service_role;

alter table public.teams enable row level security;
alter table public.team_memberships enable row level security;

create policy "members read own-org teams"
  on public.teams for select to authenticated
  using (public.is_in_org(org_id) or public.is_super_admin());

create policy "members create teams in own-org"
  on public.teams for insert to authenticated
  with check (public.is_in_org(org_id) or public.is_super_admin());

create policy "team members or org admins update teams"
  on public.teams for update to authenticated
  using (
    public.is_org_admin_for(org_id)
    or public.is_super_admin()
    or exists (
      select 1 from public.team_memberships tm
      where tm.team_id = teams.id
        and tm.user_id = auth.uid()
        and tm.org_id = teams.org_id
    )
  )
  with check (
    public.is_org_admin_for(org_id)
    or public.is_super_admin()
    or exists (
      select 1 from public.team_memberships tm
      where tm.team_id = teams.id
        and tm.user_id = auth.uid()
        and tm.org_id = teams.org_id
    )
  );

create policy "org admins delete teams"
  on public.teams for delete to authenticated
  using (public.is_org_admin_for(org_id) or public.is_super_admin());

create policy "members read own-org team_memberships"
  on public.team_memberships for select to authenticated
  using (public.is_in_org(org_id) or public.is_super_admin());

-- Direct inserts are only for joining a team as yourself.
-- The org_id must match the team's actual org_id to prevent cross-org rows.
create policy "members join teams in own-org"
  on public.team_memberships for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.is_in_org(org_id)
    and exists (
      select 1 from public.teams t
      where t.id = team_memberships.team_id
        and t.org_id = team_memberships.org_id
    )
  );

-- Any team member (any role), org admin, or super admin can remove memberships.
-- Requires the authorizing membership row to share the same org_id.
create policy "team members delete memberships"
  on public.team_memberships for delete to authenticated
  using (
    public.is_org_admin_for(org_id)
    or public.is_super_admin()
    or exists (
      select 1 from public.team_memberships tm
      where tm.team_id = team_memberships.team_id
        and tm.user_id = auth.uid()
        and tm.org_id = team_memberships.org_id
    )
  );
