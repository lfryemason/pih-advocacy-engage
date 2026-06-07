import type { Database } from "@/lib/supabase/database.types";

export type DelegationRole = Database["public"]["Enums"]["delegation_role"];

// ─── List-level types (used by meetings-section and meeting-row) ──────────────

export type MeetingRow = {
  id: string;
  meeting_date: string;
  meeting_time: string | null;
  meeting_timezone: string;
  representative_id: string;
  representative_bioguide_id: string;
  representative_name: string;
  representative_state: string;
  representative_district: number | null;
  representative_party: string;
  congressional_contact_id: string | null;
  congressional_contact_name: string;
  primary_team_id: string | null;
  primary_team_name: string | null;
  primary_team_slug: string | null;
  scheduling_lead_name: string | null;
  follow_up_date: string | null;
  champion_score: number | null;
};

// ─── Detail-level types (used by meeting-detail, delegation-form) ─────────────

export type MeetingLink = {
  label: string;
  url: string;
};

export type DelegationMember = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  pronouns: string | null;
  display_name: string;
  email: string | null;
  role: DelegationRole;
  team_id: string | null;
  team_name_snapshot: string | null;
};

export type MeetingDetail = MeetingRow & {
  notes: string | null;
  location: string | null;
  links: MeetingLink[];
  delegation_members: DelegationMember[];
  represented_teams: string[];
};

// ─── Shared component types ───────────────────────────────────────────────────

export type StafferOption = {
  id: string;
  first_name: string;
  last_name: string;
};

// ─── Form input types ─────────────────────────────────────────────────────────

export type CreateMeetingValues = {
  meeting_date: string;
  meeting_time: string | null;
  meeting_timezone: string;
  representative_id: string;
  congressional_contact_id: string | null;
  primary_team_id: string | null;
  notes: string | null;
  location: string | null;
};

export type MeetingFormValues = CreateMeetingValues & {
  follow_up_date: string | null;
  champion_score: number | null;
};

export type LinkFormEntry = MeetingLink;

export type DelegationFormEntry = {
  user_id: string;
  role: DelegationRole;
  team_id: string | null;
};

// ─── Filter types (used by meetings-filters) ──────────────────────────────────

export type MeetingFilters = {
  states: string[];
  districts: string[];
  parties: string[];
};

// ─── Profile search result (used by delegation-form user search) ──────────────

export type ProfileTeam = {
  team_id: string;
  team_name: string;
};

export type ProfileSearchResult = {
  user_id: string;
  display_name: string;
  first_name: string | null;
  last_name: string | null;
  pronouns: string | null;
  teams: ProfileTeam[];
};

// ─── Local delegation member (managed by DelegationForm in edit mode) ─────────

export type LocalDelegationMember = {
  key: string;
  dbId: string | null;
  user_id: string;
  display_name: string;
  first_name: string;
  last_name: string;
  pronouns: string | null;
  email: string | null;
  role: DelegationRole;
  team_id: string | null;
  team_name_snapshot: string | null;
};

export function memberFromDelegation(
  m: DelegationMember,
): LocalDelegationMember {
  return {
    key: m.id,
    dbId: m.id,
    user_id: m.user_id,
    display_name: m.display_name,
    first_name: m.first_name,
    last_name: m.last_name,
    pronouns: m.pronouns,
    email: m.email,
    role: m.role,
    team_id: m.team_id,
    team_name_snapshot: m.team_name_snapshot,
  };
}
