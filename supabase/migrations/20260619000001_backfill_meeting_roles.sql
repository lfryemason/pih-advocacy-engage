-- Expand phase (backfill): migrate existing rows from the retired roles onto the
-- new role set. This runs as its own migration so the enum values added in
-- 20260619000000_add_meeting_roles.sql are committed before they are used here
-- (Postgres forbids using a newly added enum value in the same transaction).

update public.meeting_delegation_members
  set role = 'expert'
  where role = 'pih_team_member';

update public.meeting_delegation_members
  set role = 'attendee'
  where role in ('attendee_talking', 'attendee_listening');
