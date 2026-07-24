-- Adds an existing profile to a team directly. RLS forbids inserting a
-- team_memberships row for another user_id ("members join teams in own-org"
-- in 20260428000000_create_teams.sql requires user_id = auth.uid()), so this
-- mirrors change_member_role: SECURITY DEFINER bypasses RLS, authorization is
-- enforced manually.
create or replace function public.add_team_member(
  p_team_id uuid,
  p_user_id uuid,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_org_id text;
begin
  if p_role not in ('member', 'team_coordinator', 'fundraising_lead', 'advocacy_lead', 'coach', 'community_building_lead') then
    raise exception 'invalid role: %', p_role;
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

  select org_id into v_org_id from public.teams where id = p_team_id;
  if v_org_id is null then
    raise exception 'team not found';
  end if;

  if not exists (
    select 1 from public.profiles where user_id = p_user_id and org_id = v_org_id
  ) then
    raise exception 'user not found in org';
  end if;

  if exists (
    select 1 from public.team_memberships
    where team_id = p_team_id and user_id = p_user_id
  ) then
    raise exception 'user is already a member of this team';
  end if;

  insert into public.team_memberships (team_id, user_id, org_id, role)
  values (p_team_id, p_user_id, v_org_id, p_role);
end;
$$;

revoke execute on function public.add_team_member(uuid, uuid, text) from public;
grant execute on function public.add_team_member(uuid, uuid, text) to authenticated;
