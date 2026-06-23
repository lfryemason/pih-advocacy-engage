-- Org admins need to read all user roles within their org (e.g. to display
-- admin badges on the admin panel). Super admins can read all roles globally.
-- The existing "users read own role" policy already covers the self-read case.
create policy "org admins read own-org user roles"
  on public.user_role for select to authenticated
  using (
    (org_id is not null and public.is_org_admin_for(org_id))
    or public.is_super_admin()
  );
