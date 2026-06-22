-- Expand phase: add the new meeting delegation roles alongside the existing ones.
-- The retired roles (attendee_talking, attendee_listening, pih_team_member) stay in
-- the enum for now and are removed in a later contract migration, so that code
-- deployed before and after this migration keeps working during the rollout.
--
-- scheduling_lead and note_taker already exist and are kept (only their labels change
-- in the app layer).

alter type public.delegation_role add value if not exists 'meeting_facilitator';
alter type public.delegation_role add value if not exists 'storyteller';
alter type public.delegation_role add value if not exists 'photographer';
alter type public.delegation_role add value if not exists 'expert';
alter type public.delegation_role add value if not exists 'attendee';
