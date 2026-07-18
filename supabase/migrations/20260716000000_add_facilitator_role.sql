-- Adds the facilitator app_role: an org-wide role for members who should
-- see all upcoming meetings but not get admin-page access. Distinct from
-- the per-meeting delegation_role value `meeting_facilitator` (a role on a
-- single meeting's delegation, not an account-wide permission).
--
-- New enum values can't be referenced in the same transaction they're added
-- in, so this is its own migration; the check constraint update and the
-- role-change RPC that reference the 'facilitator' literal live in the next
-- migration.
alter type public.app_role add value if not exists 'facilitator';
