-- facilitator behaves like member/org_admin for org alignment: it must
-- belong to exactly one org.
alter table public.user_role drop constraint chk_role_org_alignment;
alter table public.user_role
  add constraint chk_role_org_alignment check (
    (role = 'super_admin' and org_id is null)
    or (role in ('member', 'org_admin', 'facilitator') and org_id is not null)
  );

-- RPC used by the admin UI to change a user's org-wide role. Runs as
-- SECURITY DEFINER (bypassing user_role RLS, which otherwise restricts
-- writes to super_admin) so org admins can manage roles within their own
-- org without being granted broader table privileges directly. super_admin
-- can never be assigned or revoked through this function, and callers can't
-- touch a row that already belongs to a super_admin.
--
-- Every rejection (missing row, target is super_admin, caller lacks org
-- admin rights) raises the same 'permission denied' message. Granted to all
-- authenticated users, so a distinct 'not found' would let a caller probe
-- which user_ids exist across every org just by reading the error text.
create or replace function public.change_user_role(
  p_user_id uuid,
  p_new_role public.app_role
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_org_id text;
  target_role public.app_role;
begin
  if p_new_role = 'super_admin' then
    raise exception 'cannot assign super_admin';
  end if;

  select org_id, role into target_org_id, target_role
  from public.user_role
  where user_id = p_user_id;

  if not found or target_role = 'super_admin' or not (
    public.is_super_admin()
    or public.is_org_admin_for(target_org_id)
  ) then
    raise exception 'permission denied';
  end if;

  update public.user_role
  set role = p_new_role
  where user_id = p_user_id;
end;
$$;

revoke execute on function public.change_user_role(uuid, public.app_role) from public;
grant execute on function public.change_user_role(uuid, public.app_role) to authenticated;
