import { createClient } from "@/lib/supabase/client";
import {
  MeetingFilters,
  CreateMeetingValues,
  MeetingFormValues,
  LinkFormEntry,
  MeetingRow,
  MeetingDetail,
  MeetingLink,
  DelegationMember,
  DelegationRole,
  DelegationFormEntry,
  LocalDelegationMember,
  ProfileSearchResult,
  TeamGroup,
  parseMeetingLocation,
} from "@/lib/meetings/types";
import { localDateString } from "@/lib/utils";
import { ORG_ID } from "@/lib/org";

type SupabaseBrowserClient = ReturnType<typeof createClient>;

type RawRow = {
  id: string;
  meeting_date: string;
  meeting_time: string | null;
  meeting_timezone: string;
  representative_id: string;
  congressional_contact_id: string | null;
  primary_team_id: string | null;
  location: unknown;
  follow_up_date: string | null;
  follow_up_completed: boolean;
  champion_score: number | null;
  representatives: {
    bioguide_id: string;
    official_full_name: string | null;
    pronouns: string | null;
    state: string;
    district: number | null;
    party: string;
  };
  staffers: { first_name: string; last_name: string } | null;
  teams: { name: string; slug: string } | null;
  meeting_delegation_members: {
    user_id: string;
    role: string;
    profiles: { first_name: string | null; last_name: string | null } | null;
  }[];
};

function mapRow(row: RawRow): MeetingRow {
  const rep = row.representatives;
  const staffer = row.staffers;
  const schedulingLead = row.meeting_delegation_members.find(
    (member) => member.role === "scheduling_lead",
  );

  return {
    id: row.id,
    meeting_date: row.meeting_date,
    meeting_time: row.meeting_time,
    meeting_timezone: row.meeting_timezone,
    representative_id: row.representative_id,
    representative_bioguide_id: rep.bioguide_id,
    representative_name: rep.official_full_name ?? "",
    representative_pronouns: rep.pronouns ?? null,
    representative_state: rep.state,
    representative_district: rep.district,
    representative_party: rep.party,
    congressional_contact_id: row.congressional_contact_id,
    congressional_contact_name: staffer
      ? `${staffer.first_name} ${staffer.last_name}`
      : (rep.official_full_name ?? ""),
    primary_team_id: row.primary_team_id,
    primary_team_name: row.teams?.name ?? null,
    primary_team_slug: row.teams?.slug ?? null,
    location: parseMeetingLocation(row.location),
    scheduling_lead_name: schedulingLead?.profiles
      ? [schedulingLead.profiles.first_name, schedulingLead.profiles.last_name]
          .filter(Boolean)
          .join(" ") || null
      : null,
    follow_up_date: row.follow_up_date,
    follow_up_completed: row.follow_up_completed,
    champion_score: row.champion_score,
    delegation_user_ids: row.meeting_delegation_members.map((m) => m.user_id),
  };
}

const SELECT = `
  id,
  meeting_date,
  meeting_time,
  meeting_timezone,
  representative_id,
  congressional_contact_id,
  primary_team_id,
  location,
  follow_up_date,
  follow_up_completed,
  champion_score,
  representatives!inner ( bioguide_id, official_full_name, pronouns, state, district, party ),
  staffers ( first_name, last_name ),
  teams ( name, slug ),
  meeting_delegation_members ( user_id, role, profiles ( first_name, last_name ) )
`;

export async function fetchMeetings(
  supabase: SupabaseBrowserClient,
  {
    filters,
    representativeId,
    section,
    offset,
    limit,
    teamId,
    meetingIds,
  }: {
    filters: MeetingFilters;
    representativeId?: string;
    section: "upcoming" | "past";
    offset: number;
    limit: number;
    teamId?: string;
    meetingIds?: string[];
  },
): Promise<{ meetings: MeetingRow[]; count: number }> {
  const today = localDateString();

  let query = supabase
    .from("meetings")
    .select(SELECT, { count: "exact" })
    .order("meeting_date", { ascending: false });

  if (section === "upcoming") {
    query = query.gte("meeting_date", today);
  } else {
    query = query.lt("meeting_date", today);
  }

  if (representativeId) {
    query = query.eq("representative_id", representativeId);
  }

  if (teamId) {
    query = query.eq("primary_team_id", teamId);
  }

  if (meetingIds && meetingIds.length > 0) {
    query = query.in("id", meetingIds);
  }

  if (filters.states.length > 0) {
    query = query.filter(
      "representatives.state",
      "in",
      `(${filters.states.map((stateCode) => `"${stateCode}"`).join(",")})`,
    );
  }
  if (filters.districts.length > 0) {
    const numbers = filters.districts.filter(
      (district) => district !== "at-large",
    );
    const includesAtLarge = filters.districts.includes("at-large");
    if (numbers.length > 0 && includesAtLarge) {
      query = query.or(`district.in.(${numbers.join(",")}),district.is.null`, {
        referencedTable: "representatives",
      });
    } else if (numbers.length > 0) {
      query = query.filter(
        "representatives.district",
        "in",
        `(${numbers.join(",")})`,
      );
    } else {
      query = query.filter("representatives.district", "is", null);
    }
  }
  if (filters.parties.length > 0) {
    query = query.filter(
      "representatives.party",
      "in",
      `(${filters.parties.map((party) => `"${party}"`).join(",")})`,
    );
  }
  if (filters.representativeIds.length > 0) {
    query = query.in("representative_id", filters.representativeIds);
  }
  if (filters.dateRange.from) {
    query = query.gte("meeting_date", filters.dateRange.from);
  }
  if (filters.dateRange.to) {
    query = query.lte("meeting_date", filters.dateRange.to);
  }

  // Location filters apply to the meetings table's own jsonb column.
  if (filters.isVirtual === true) {
    query = query.filter("location->>isVirtual", "eq", "true");
  } else if (filters.isVirtual === false) {
    // In-person includes meetings with no location set at all.
    query = query.or("location->>isVirtual.eq.false,location.is.null");
  }
  if (filters.buildings.length > 0) {
    // ilike (no wildcards) gives a case-insensitive exact match per building.
    const ors = filters.buildings
      .map((b) => sanitizeBuildingFilter(b))
      .filter(Boolean)
      .map((b) => `location->>building.ilike.${b}`)
      .join(",");
    if (ors) query = query.or(ors);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    meetings: (data as unknown as RawRow[]).map(mapRow),
    count: count ?? 0,
  };
}

// Strip characters that are structural in PostgREST filter strings or act as
// LIKE wildcards, mirroring the sanitization in searchProfiles below.
function sanitizeBuildingFilter(value: string): string {
  return value.replace(/[,()%_"']/g, "").trim();
}

// Distinct building names already used across the org's meetings, deduped
// case-insensitively (keeping the first-seen casing). Feeds both the building
// filter dropdown and the create/edit form autocomplete.
export async function fetchMeetingBuildings(
  supabase: SupabaseBrowserClient,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("meetings")
    .select("location")
    .eq("org_id", ORG_ID)
    .not("location", "is", null);

  if (error) throw error;

  const seen = new Map<string, string>();
  for (const row of (data as unknown as { location: unknown }[]) ?? []) {
    const building = parseMeetingLocation(row.location)?.building.trim();
    if (!building) continue;
    const key = building.toLowerCase();
    if (!seen.has(key)) seen.set(key, building);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

export async function createMeeting(
  supabase: SupabaseBrowserClient,
  values: CreateMeetingValues,
  rawLinks: LinkFormEntry[],
  primaryTeamName: string | null = null,
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const links = rawLinks.filter((l) => l.label.trim() || l.url.trim());

  const { data, error } = await supabase
    .from("meetings")
    .insert({
      org_id: ORG_ID,
      meeting_date: values.meeting_date,
      meeting_time: values.meeting_time,
      meeting_timezone: values.meeting_timezone,
      representative_id: values.representative_id,
      congressional_contact_id: values.congressional_contact_id,
      primary_team_id: values.primary_team_id,
      notes: values.notes,
      location: values.location,
      links,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) throw error;
  if (!data) throw new Error("Meeting created but ID could not be retrieved");

  const { error: delegationError } = await supabase
    .from("meeting_delegation_members")
    .insert({
      org_id: ORG_ID,
      meeting_id: data.id,
      user_id: user.id,
      role: "scheduling_lead",
      team_id: values.primary_team_id,
      team_name_snapshot: primaryTeamName,
    });

  if (delegationError) {
    const { error: cleanupError } = await supabase
      .from("meetings")
      .delete()
      .eq("id", data.id);
    if (cleanupError) {
      throw new Error(
        `Meeting created but delegation failed and cleanup also failed (meeting id: ${data.id}): ${delegationError.message}`,
      );
    }
    throw delegationError;
  }

  return data.id;
}

type RawDetailDelegationMember = {
  id: string;
  user_id: string;
  role: string;
  team_id: string | null;
  team_name_snapshot: string | null;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    pronouns: string | null;
    email: string | null;
  } | null;
};

type RawDetailRow = Omit<RawRow, "meeting_delegation_members"> & {
  notes: string | null;
  location: unknown;
  links: MeetingLink[] | null;
  meeting_delegation_members: RawDetailDelegationMember[];
};

const SELECT_DETAIL = `
  id,
  meeting_date,
  meeting_time,
  meeting_timezone,
  representative_id,
  congressional_contact_id,
  primary_team_id,
  follow_up_date,
  follow_up_completed,
  champion_score,
  notes,
  location,
  links,
  representatives!inner ( bioguide_id, official_full_name, pronouns, state, district, party ),
  staffers ( first_name, last_name ),
  teams ( name, slug ),
  meeting_delegation_members ( id, user_id, role, team_id, team_name_snapshot, profiles ( first_name, last_name, pronouns, email ) )
`;

export async function fetchMeetingDetail(
  supabase: SupabaseBrowserClient,
  id: string,
): Promise<MeetingDetail> {
  const { data, error } = await supabase
    .from("meetings")
    .select(SELECT_DETAIL)
    .eq("id", id)
    .single();

  if (error) throw error;
  const row = data as unknown as RawDetailRow;

  const delegation_members: DelegationMember[] =
    row.meeting_delegation_members.map((m) => ({
      id: m.id,
      user_id: m.user_id,
      first_name: m.profiles?.first_name ?? "",
      last_name: m.profiles?.last_name ?? "",
      pronouns: m.profiles?.pronouns ?? null,
      display_name: m.profiles
        ? buildDisplayName(m.profiles.first_name, m.profiles.last_name)
        : "Anonymous",
      email: m.profiles?.email ?? null,
      role: m.role as DelegationRole,
      team_id: m.team_id,
      team_name_snapshot: m.team_name_snapshot,
    }));

  const represented_teams = [
    ...new Set(
      delegation_members
        .map((m) => m.team_name_snapshot)
        .filter((t): t is string => !!t && t.trim() !== ""),
    ),
  ];

  return {
    ...mapRow(row),
    notes: row.notes,
    location: parseMeetingLocation(row.location),
    links: row.links ?? [],
    delegation_members,
    represented_teams,
  };
}

export async function updateMeeting(
  supabase: SupabaseBrowserClient,
  id: string,
  values: MeetingFormValues,
  rawLinks: LinkFormEntry[],
): Promise<void> {
  const links = rawLinks.filter((l) => l.label.trim() || l.url.trim());

  const { error } = await supabase
    .from("meetings")
    .update({
      meeting_date: values.meeting_date,
      meeting_time: values.meeting_time,
      meeting_timezone: values.meeting_timezone,
      representative_id: values.representative_id,
      congressional_contact_id: values.congressional_contact_id,
      primary_team_id: values.primary_team_id,
      notes: values.notes,
      location: values.location,
      follow_up_date: values.follow_up_date,
      follow_up_completed: values.follow_up_completed,
      champion_score: values.champion_score,
      links,
    })
    .eq("id", id);

  if (error) throw error;
}

export async function deleteMeeting(
  supabase: SupabaseBrowserClient,
  id: string,
): Promise<void> {
  // Delegation members are removed automatically via the
  // meeting_delegation_members.meeting_id ON DELETE CASCADE.
  const { error } = await supabase.from("meetings").delete().eq("id", id);
  if (error) throw error;
}

type RawProfile = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  pronouns: string | null;
  team_memberships: Array<{
    team_id: string;
    teams: { name: string } | null;
  }>;
};

function buildDisplayName(
  firstName: string | null,
  lastName: string | null,
): string {
  return [firstName, lastName].filter(Boolean).join(" ") || "Anonymous";
}

function mapRawProfile(p: RawProfile): ProfileSearchResult {
  return {
    user_id: p.user_id,
    display_name: buildDisplayName(p.first_name, p.last_name),
    first_name: p.first_name,
    last_name: p.last_name,
    pronouns: p.pronouns,
    teams: (p.team_memberships ?? [])
      .filter((tm) => tm.teams?.name)
      .map((tm) => ({ team_id: tm.team_id, team_name: tm.teams!.name })),
  };
}

export async function searchProfiles(
  supabase: SupabaseBrowserClient,
  query: string,
): Promise<ProfileSearchResult[]> {
  if (!query.trim()) return [];

  // Strip characters that are structural in PostgREST filter strings or
  // act as LIKE wildcards to prevent injection and unintended wildcard matches.
  const safeQuery = query.replace(/[,()\%_"']/g, "");
  if (!safeQuery.trim()) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select(
      `user_id, first_name, last_name, pronouns, team_memberships ( team_id, teams ( name ) )`,
    )
    .eq("org_id", ORG_ID)
    .or(`first_name.ilike.%${safeQuery}%,last_name.ilike.%${safeQuery}%`)
    .limit(10);

  if (error) throw error;

  return (data as unknown as RawProfile[]).map(mapRawProfile);
}

export async function fetchMyTeamMembers(
  supabase: SupabaseBrowserClient,
): Promise<TeamGroup[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: myMemberships, error: myError } = await supabase
    .from("team_memberships")
    .select("team_id, teams ( name )")
    .eq("user_id", user.id);

  if (myError || !myMemberships || myMemberships.length === 0) return [];

  type RawMyMembership = { team_id: string; teams: { name: string } | null };
  const typed = myMemberships as unknown as RawMyMembership[];

  const myTeamIds = typed.map((m) => m.team_id);
  const teamNames = new Map(
    typed.map((m) => [m.team_id, m.teams?.name ?? "Unknown"]),
  );

  // Single query: profiles that share at least one of the current user's teams.
  // The !inner join + filter restricts both which team_memberships rows are
  // returned and which profiles are included (inner-join semantics).
  const { data: profilesData, error: profilesError } = await supabase
    .from("profiles")
    .select(
      "user_id, first_name, last_name, pronouns, team_memberships!inner ( team_id, teams ( name ) )",
    )
    .eq("org_id", ORG_ID)
    .filter("team_memberships.team_id", "in", `(${myTeamIds.join(",")})`);

  if (profilesError || !profilesData) return [];

  const groups = new Map<
    string,
    { team_name: string; profiles: ProfileSearchResult[] }
  >();

  for (const p of profilesData as unknown as RawProfile[]) {
    const profile = mapRawProfile(p);
    for (const tm of p.team_memberships) {
      if (!groups.has(tm.team_id)) {
        groups.set(tm.team_id, {
          team_name: teamNames.get(tm.team_id) ?? "Unknown",
          profiles: [],
        });
      }
      groups.get(tm.team_id)!.profiles.push(profile);
    }
  }

  return [...groups.entries()].map(([team_id, { team_name, profiles }]) => ({
    team_id,
    team_name,
    profiles,
  }));
}

export async function addDelegationMember(
  supabase: SupabaseBrowserClient,
  meetingId: string,
  entry: DelegationFormEntry,
  teamSnapshot: string | null,
): Promise<void> {
  const { error } = await supabase.from("meeting_delegation_members").insert({
    org_id: ORG_ID,
    meeting_id: meetingId,
    user_id: entry.user_id,
    role: entry.role,
    team_id: entry.team_id,
    team_name_snapshot: teamSnapshot,
  });
  if (error) throw error;
}

export async function removeDelegationMember(
  supabase: SupabaseBrowserClient,
  delegationMemberId: string,
): Promise<void> {
  const { error } = await supabase
    .from("meeting_delegation_members")
    .delete()
    .eq("id", delegationMemberId);
  if (error) throw error;
}

export async function updateDelegationMemberRole(
  supabase: SupabaseBrowserClient,
  delegationMemberId: string,
  role: DelegationRole,
): Promise<void> {
  const { error } = await supabase
    .from("meeting_delegation_members")
    .update({ role })
    .eq("id", delegationMemberId);
  if (error) throw error;
}

export async function syncDelegationMembers(
  supabase: SupabaseBrowserClient,
  meetingId: string,
  originalMembers: DelegationMember[],
  currentMembers: LocalDelegationMember[],
): Promise<void> {
  const currentDbIds = new Set(
    currentMembers.filter((m) => m.dbId).map((m) => m.dbId!),
  );

  const toRemove = originalMembers.filter((m) => !currentDbIds.has(m.id));
  const toAdd = currentMembers.filter((m) => !m.dbId);
  const origById = new Map(originalMembers.map((o) => [o.id, o]));
  const roleChanged = currentMembers.filter((m) => {
    if (!m.dbId) return false;
    const orig = origById.get(m.dbId);
    return orig && orig.role !== m.role;
  });

  await Promise.all([
    ...toRemove.map((m) => removeDelegationMember(supabase, m.id)),
    ...roleChanged.map((m) =>
      updateDelegationMemberRole(supabase, m.dbId!, m.role),
    ),
    ...toAdd.map((m) =>
      addDelegationMember(
        supabase,
        meetingId,
        { user_id: m.user_id, role: m.role, team_id: m.team_id },
        m.team_name_snapshot,
      ),
    ),
  ]);
}

export async function fetchMyTeams(
  supabase: SupabaseBrowserClient,
): Promise<{ team_id: string; team_name: string }[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("team_memberships")
    .select("team_id, teams(name)")
    .eq("user_id", user.id);

  if (error || !data) return [];

  type RawMembership = { team_id: string; teams: { name: string } | null };
  return (data as unknown as RawMembership[])
    .filter((m) => m.teams?.name)
    .map((m) => ({ team_id: m.team_id, team_name: m.teams!.name }));
}

export type PersonalFetchParams = {
  filters: MeetingFilters;
  section: "upcoming" | "past";
  offset: number;
  limit: number;
};

async function fetchDelegationMeetingIds(
  supabase: SupabaseBrowserClient,
  column: "user_id" | "team_id",
  value: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("meeting_delegation_members")
    .select("meeting_id")
    .eq(column, value);

  if (error || !data) return [];

  return (data as { meeting_id: string }[]).map(
    (delegation) => delegation.meeting_id,
  );
}

// Resolves the set of meeting ids a user (or their team) is delegated to.
// Callers should resolve this once per mount/scope change and reuse the
// result across pagination requests rather than re-querying it on every
// page fetch.
export async function fetchMyDelegationMeetingIds(
  supabase: SupabaseBrowserClient,
): Promise<string[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  return fetchDelegationMeetingIds(supabase, "user_id", user.id);
}

export async function fetchTeamDelegationMeetingIds(
  supabase: SupabaseBrowserClient,
  teamId: string,
): Promise<string[]> {
  return fetchDelegationMeetingIds(supabase, "team_id", teamId);
}
