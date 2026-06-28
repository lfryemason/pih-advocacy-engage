-- Who can delete a meeting: org admins, super admins, or the meeting's
-- scheduling lead. The lead is whoever currently holds the 'scheduling_lead'
-- delegation role — the creator by default, or whoever it was intentionally
-- reassigned to — so handing off the lead also hands off delete rights. A
-- meeting can have more than one scheduling lead; any of them may delete it.
-- Insert/update stay open to any org member. Delegation rows are removed via
-- the meeting_delegation_members.meeting_id ON DELETE CASCADE.

-- SECURITY DEFINER so the policy can read meeting_delegation_members without
-- tripping that table's RLS (mirrors is_org_admin_for / is_in_org).
create or replace function public.is_meeting_scheduling_lead(target_meeting_id uuid)
  returns boolean
  language sql
  stable
  security definer
  set search_path = public, pg_temp
  as $$
    select exists (
      select 1 from public.meeting_delegation_members
      where meeting_id = target_meeting_id
        and user_id = auth.uid()
        and role = 'scheduling_lead'
    );
  $$;

revoke execute on function public.is_meeting_scheduling_lead(uuid) from public;
grant execute on function public.is_meeting_scheduling_lead(uuid) to authenticated;

drop policy if exists "org admins delete own-org meetings" on public.meetings;

create policy "admins or scheduling lead delete own-org meetings"
  on public.meetings for delete to authenticated
  using (
    public.is_super_admin()
    or public.is_org_admin_for(org_id)
    or public.is_meeting_scheduling_lead(id)
  );
