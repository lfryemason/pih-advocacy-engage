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
  representative_pronouns: string | null;
  representative_state: string;
  representative_district: number | null;
  representative_party: string;
  congressional_contact_id: string | null;
  congressional_contact_name: string;
  primary_team_id: string | null;
  primary_team_name: string | null;
  primary_team_slug: string | null;
  location: MeetingLocation | null;
  scheduling_lead_name: string | null;
  follow_up_date: string | null;
  follow_up_completed: boolean;
  champion_score: number | null;
  delegation_user_ids: string[];
};

// ─── Detail-level types (used by meeting-detail, delegation-form) ─────────────

export type MeetingLink = {
  label: string;
  url: string;
};

export type MeetingLocation = {
  isVirtual: boolean;
  city: string;
  state: string;
  building: string;
  room: string;
};

export const EMPTY_LOCATION: MeetingLocation = {
  isVirtual: false,
  city: "",
  state: "",
  building: "",
  room: "",
};

// Coerce a raw DB jsonb value into a MeetingLocation, applying defaults for any
// missing/malformed keys. Returns null when there is no location data at all.
export function parseMeetingLocation(raw: unknown): MeetingLocation | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  return {
    isVirtual: r.isVirtual === true,
    city: typeof r.city === "string" ? r.city : "",
    state: typeof r.state === "string" ? r.state : "",
    building: typeof r.building === "string" ? r.building : "",
    room: typeof r.room === "string" ? r.room : "",
  };
}

// Virtual meetings carry no physical address. This is applied at save time
// rather than when the virtual toggle changes, so switching the toggle a
// couple of times while editing doesn't silently discard an in-progress or
// existing address.
export function normalizeLocationForSave(
  loc: MeetingLocation,
): MeetingLocation {
  return loc.isVirtual ? { ...EMPTY_LOCATION, isVirtual: true } : loc;
}

// An in-person location with every field blank carries no information, so it is
// stored as null rather than an empty object.
export function isLocationEmpty(loc: MeetingLocation): boolean {
  return (
    !loc.isVirtual &&
    !loc.city.trim() &&
    !loc.state.trim() &&
    !loc.building.trim() &&
    !loc.room.trim()
  );
}

// Renders a MeetingLocation back into the free-text shape the legacy
// `location` column expects, mirroring the parsing rules in the
// add_meeting_location_json migration ("<digits> <rest>" -> room + building)
// so a later re-parse of this text recovers the same structured value.
// Writing both columns keeps `location` from going stale between the
// location_json backfill and the migration that eventually drops it.
export function toLegacyLocationText(
  loc: MeetingLocation | null,
): string | null {
  if (!loc || isLocationEmpty(loc)) return null;
  if (loc.isVirtual) return "Virtual";
  const building = loc.building.trim();
  const room = loc.room.trim();
  if (building && room) return `${room} ${building}`;
  return building || room || null;
}

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
  location: MeetingLocation | null;
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
  location: MeetingLocation | null;
};

export type MeetingFormValues = CreateMeetingValues & {
  follow_up_date: string | null;
  follow_up_completed: boolean;
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
  representativeIds: string[];
  dateRange: { from: string | null; to: string | null };
  buildings: string[];
  // null = either, true = virtual only, false = in-person only
  isVirtual: boolean | null;
  delegationUserIds: string[];
};

export type DelegationMemberOption = {
  user_id: string;
  display_name: string;
};

// ─── Profile search result (used by delegation-form user search) ──────────────

export type ProfileTeam = {
  team_id: string;
  team_name: string;
};

export type TeamGroup = {
  team_id: string;
  team_name: string;
  profiles: ProfileSearchResult[];
};

export type ProfileSearchResult = {
  user_id: string;
  display_name: string;
  first_name: string | null;
  last_name: string | null;
  pronouns: string | null;
  email: string;
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
  display_teams: ProfileTeam[];
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
    display_teams:
      m.team_id && m.team_name_snapshot
        ? [{ team_id: m.team_id, team_name: m.team_name_snapshot }]
        : [],
  };
}
