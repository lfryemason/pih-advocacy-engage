export type DelegationRole =
  | "scheduling_lead"
  | "attendee_talking"
  | "attendee_listening"
  | "pih_team_member"
  | "note_taker";

// ─── List-level types (used by meetings-section and meeting-row) ──────────────

export type MeetingRow = {
  id: string;
  meeting_date: string;
  meeting_time: string | null;
  representative_id: string;
  representative_name: string;
  representative_state: string;
  representative_district: number | null;
  representative_party: string;
  congressional_contact_id: string | null;
  congressional_contact_name: string;
  primary_team_id: string | null;
  primary_team_name: string | null;
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
  display_name: string;
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

// ─── Form input types ─────────────────────────────────────────────────────────

export type MeetingFormValues = {
  meeting_date: string;
  meeting_time: string | null;
  representative_id: string;
  congressional_contact_id: string | null;
  primary_team_id: string | null;
  notes: string;
  location: string;
  follow_up_date: string | null;
  champion_score: number | null;
};

export type LinkFormEntry = {
  label: string;
  url: string;
};

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
  teams: ProfileTeam[];
};
