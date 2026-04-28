-- Allow team members (any role) to insert membership rows for others,
-- not just themselves. Required for role-change operations from the edit table.
drop policy "members join teams in own-org" on public.team_memberships;

create policy "members join teams in own-org"
  on public.team_memberships for insert to authenticated
  with check (
    public.is_in_org(org_id)
    and (
      user_id = auth.uid()
      or public.is_org_admin_for(org_id)
      or public.is_super_admin()
      or exists (
        select 1 from public.team_memberships tm
        where tm.team_id = team_memberships.team_id and tm.user_id = auth.uid()
      )
    )
  );
