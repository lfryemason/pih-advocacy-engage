import { createClient } from "@/lib/supabase/client";
import {
  MeetingFilters,
  CreateMeetingValues,
  LinkFormEntry,
  MeetingRow,
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
  follow_up_date: string | null;
  champion_score: number | null;
  representatives: {
    bioguide_id: string;
    official_full_name: string | null;
    state: string;
    district: number | null;
    party: string;
  };
  staffers: { first_name: string; last_name: string } | null;
  teams: { name: string; slug: string } | null;
  meeting_delegation_members: {
    role: string;
    profiles: { first_name: string | null; last_name: string | null } | null;
  }[];
};

function mapRow(row: RawRow): MeetingRow {
  const rep = row.representatives;
  const staffer = row.staffers;
  const schedulingLead = row.meeting_delegation_members.find(
    (m) => m.role === "scheduling_lead",
  );

  return {
    id: row.id,
    meeting_date: row.meeting_date,
    meeting_time: row.meeting_time,
    meeting_timezone: row.meeting_timezone,
    representative_id: row.representative_id,
    representative_bioguide_id: rep.bioguide_id,
    representative_name: rep.official_full_name ?? "",
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
    scheduling_lead_name: schedulingLead?.profiles
      ? [schedulingLead.profiles.first_name, schedulingLead.profiles.last_name]
          .filter(Boolean)
          .join(" ") || null
      : null,
    follow_up_date: row.follow_up_date,
    champion_score: row.champion_score,
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
  follow_up_date,
  champion_score,
  representatives!inner ( bioguide_id, official_full_name, state, district, party ),
  staffers ( first_name, last_name ),
  teams ( name, slug ),
  meeting_delegation_members ( role, profiles ( first_name, last_name ) )
`;

export async function fetchMeetings(
  supabase: SupabaseBrowserClient,
  {
    filters,
    section,
    offset,
    limit,
  }: {
    filters: MeetingFilters;
    section: "upcoming" | "past";
    offset: number;
    limit: number;
  },
): Promise<{ meetings: MeetingRow[]; count: number }> {
  const today = localDateString();

  let query = supabase
    .from("meetings")
    .select(SELECT, { count: "exact" })
    .order("meeting_date", { ascending: section === "upcoming" });

  if (section === "upcoming") {
    query = query.gte("meeting_date", today);
  } else {
    query = query.lt("meeting_date", today);
  }

  if (filters.states.length > 0) {
    query = query.filter(
      "representatives.state",
      "in",
      `(${filters.states.map((s) => `"${s}"`).join(",")})`,
    );
  }
  if (filters.districts.length > 0) {
    const numbers = filters.districts.filter((d) => d !== "at-large");
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
      `(${filters.parties.map((p) => `"${p}"`).join(",")})`,
    );
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    meetings: (data as unknown as RawRow[]).map(mapRow),
    count: count ?? 0,
  };
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
    await supabase.from("meetings").delete().eq("id", data.id);
    throw delegationError;
  }

  return data.id;
}
