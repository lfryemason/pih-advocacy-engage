import { createClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase/database.types";

const SUPABASE_URL = process.env.API_URL ?? "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY ?? "";

const supabase = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY);

const ORG_ID = "pihe";

async function main() {
  // Pick a real user to be created_by
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("user_id, first_name, last_name")
    .eq("org_id", ORG_ID)
    .limit(1)
    .single();

  if (profileError || !profile) {
    // Fall back to a hard-coded auth user if no profile exists yet
    console.log("No profile found, using test user from auth.users...");
  }

  const { data: authUsers } = await supabase.auth.admin.listUsers();
  const createdBy = profile?.user_id ?? authUsers?.users[0]?.id;
  if (!createdBy) throw new Error("No user found to use as created_by");
  console.log(
    `Using created_by: ${createdBy} (${profile?.first_name ?? "unknown"})`,
  );

  // Get some representatives
  const { data: reps, error: repsError } = await supabase
    .from("representatives")
    .select("id, official_full_name, state, district, party")
    .eq("in_office", true)
    .in("state", ["MA", "WA", "CA", "TX", "NY"])
    .order("state")
    .limit(6);

  if (repsError || !reps?.length)
    throw new Error(`No reps: ${repsError?.message}`);
  console.log(`Found ${reps.length} representatives`);
  reps.forEach((r) =>
    console.log(
      `  ${r.official_full_name} (${r.state}-${r.district ?? "S"}, ${r.party})`,
    ),
  );

  // Get a team if available
  const { data: teams } = await supabase
    .from("teams")
    .select("id, name")
    .eq("org_id", ORG_ID)
    .limit(3);

  const team1 = teams?.[0] ?? null;
  const team2 = teams?.[1] ?? null;
  console.log(`\nTeams: ${teams?.map((t) => t.name).join(", ") ?? "none"}`);

  // Get staffers if available
  const { data: staffers } = await supabase
    .from("staffers")
    .select("id, first_name, last_name, representative_id")
    .eq("org_id", ORG_ID)
    .limit(5);

  console.log(
    `Staffers: ${staffers?.map((s) => `${s.first_name} ${s.last_name}`).join(", ") ?? "none"}`,
  );

  // Clear existing meetings
  await supabase.from("meetings").delete().eq("org_id", ORG_ID);
  console.log("\nCleared existing meetings");

  const today = new Date();
  const date = (daysFromToday: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + daysFromToday);
    return d.toISOString().slice(0, 10);
  };

  const meetings = [
    {
      org_id: ORG_ID,
      meeting_date: date(7),
      meeting_time: "2:00 PM ET",
      representative_id: reps[0].id,
      congressional_contact_id:
        staffers?.[0]?.representative_id === reps[0].id ? staffers[0].id : null,
      primary_team_id: team1?.id ?? null,
      location: "Virtual",
      notes:
        "Discussing H.R. 1234 — Global Health Security Act. Follow up on TB funding.",
      follow_up_date: null,
      champion_score: 4,
      links: [
        { label: "PIH One-Pager", url: "https://pih.org/one-pager" },
        { label: "H.R. 1234 Summary", url: "https://congress.gov/hr1234" },
      ],
      created_by: createdBy,
    },
    {
      org_id: ORG_ID,
      meeting_date: date(14),
      meeting_time: "10:30 AM ET",
      representative_id: reps[1]?.id ?? reps[0].id,
      congressional_contact_id: null,
      primary_team_id: team2?.id ?? team1?.id ?? null,
      location: "509 Hart Senate Office Building, Washington DC",
      notes: "Introductory meeting with new staff. Prioritize maternal health.",
      follow_up_date: null,
      champion_score: null,
      links: [],
      created_by: createdBy,
    },
    {
      org_id: ORG_ID,
      meeting_date: date(21),
      meeting_time: "3:30 PM ET",
      representative_id: reps[2]?.id ?? reps[0].id,
      congressional_contact_id: null,
      primary_team_id: team1?.id ?? null,
      location: "Virtual",
      notes: null,
      follow_up_date: null,
      champion_score: 2,
      links: [{ label: "Briefing Doc", url: "https://pih.org/brief" }],
      created_by: createdBy,
    },
    {
      org_id: ORG_ID,
      meeting_date: date(-10),
      meeting_time: "1:00 PM ET",
      representative_id: reps[3]?.id ?? reps[0].id,
      congressional_contact_id: staffers?.[1]?.id ?? null,
      primary_team_id: team1?.id ?? null,
      location: "2268 Rayburn House Office Building",
      notes:
        "Discussed FY2026 global health appropriations. Rep was very engaged.",
      follow_up_date: date(-3),
      champion_score: 5,
      links: [
        { label: "Appropriations Brief", url: "https://pih.org/approp" },
        { label: "Meeting Notes", url: "https://docs.google.com/notes" },
      ],
      created_by: createdBy,
    },
    {
      org_id: ORG_ID,
      meeting_date: date(-30),
      meeting_time: "11:00 AM ET",
      representative_id: reps[4]?.id ?? reps[0].id,
      congressional_contact_id: null,
      primary_team_id: team2?.id ?? null,
      location: "Virtual",
      notes: "Budget advocacy call — cholera response in Haiti.",
      follow_up_date: date(-20),
      champion_score: 3,
      links: [],
      created_by: createdBy,
    },
    {
      org_id: ORG_ID,
      meeting_date: date(-90),
      meeting_time: null,
      representative_id: reps[5]?.id ?? reps[0].id,
      congressional_contact_id: null,
      primary_team_id: null,
      location: "1003 Longworth House Office Building",
      notes: null,
      follow_up_date: null,
      champion_score: null,
      links: [],
      created_by: createdBy,
    },
  ];

  const { error: insertError } = await supabase
    .from("meetings")
    .insert(meetings);
  if (insertError) throw new Error(`Insert failed: ${insertError.message}`);

  console.log(`\nInserted ${meetings.length} meetings:`);
  const upcoming = meetings.filter(
    (m) => m.meeting_date >= today.toISOString().slice(0, 10),
  );
  const past = meetings.filter(
    (m) => m.meeting_date < today.toISOString().slice(0, 10),
  );
  console.log(
    `  Upcoming: ${upcoming.length} (${upcoming.map((m) => m.meeting_date).join(", ")})`,
  );
  console.log(
    `  Past:     ${past.length} (${past.map((m) => m.meeting_date).join(", ")})`,
  );
  console.log("\nDone!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
