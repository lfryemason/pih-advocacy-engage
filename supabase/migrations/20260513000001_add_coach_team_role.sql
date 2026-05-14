-- Add 'coach' as a membership role, consistent with how team_lead,
-- fundraising_lead, and advocacy_lead work.

alter table public.team_memberships drop constraint team_memberships_role_check;
alter table public.team_memberships
  add constraint team_memberships_role_check
  check (role in ('member', 'team_lead', 'fundraising_lead', 'advocacy_lead', 'coach'));

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
  if p_new_role not in ('member', 'team_lead', 'fundraising_lead', 'advocacy_lead', 'coach') then
    raise exception 'invalid role: %', p_new_role;
  end if;

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
