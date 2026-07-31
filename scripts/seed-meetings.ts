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

  // Get some representatives (mix of House and Senate)
  const { data: reps, error: repsError } = await supabase
    .from("representatives")
    .select("id, official_full_name, state, district, party")
    .eq("in_office", true)
    .order("state")
    .limit(40);

  if (repsError || !reps?.length)
    throw new Error(`No reps: ${repsError?.message}`);

  // Ensure at least one senator is included
  const hasSenator = reps.some((r) => r.district === null);
  if (!hasSenator) {
    const { data: senator } = await supabase
      .from("representatives")
      .select("id, official_full_name, state, district, party")
      .eq("in_office", true)
      .is("district", null)
      .limit(1)
      .single();
    if (senator) reps.unshift(senator);
  }
  console.log(`Found ${reps.length} representatives`);

  // Get a team if available
  const { data: teams } = await supabase
    .from("teams")
    .select("id, name")
    .eq("org_id", ORG_ID)
    .limit(3);

  console.log(`\nTeams: ${teams?.map((t) => t.name).join(", ") ?? "none"}`);

  // Get staffers if available
  const { data: staffers } = await supabase
    .from("staffers")
    .select("id, first_name, last_name, representative_id")
    .eq("org_id", ORG_ID)
    .limit(10);

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

  const times = [
    "9:00 AM ET",
    "10:00 AM ET",
    "10:30 AM ET",
    "11:00 AM ET",
    "1:00 PM ET",
    "2:00 PM ET",
    "2:30 PM ET",
    "3:30 PM ET",
    null,
  ];
  const blank = { isVirtual: false, city: "", state: "" };
  const locations = [
    { isVirtual: true, city: "", state: "", building: "", room: "" },
    { ...blank, building: "Hart Senate Office Building", room: "509" },
    { ...blank, building: "Rayburn House Office Building", room: "2268" },
    { ...blank, building: "Longworth House Office Building", room: "1003" },
    { ...blank, building: "Russell Senate Office Building", room: "" },
    null,
  ];
  const pick = <T>(arr: T[], i: number) => arr[i % arr.length];

  const meetings = [
    // 30 upcoming meetings spread over the next ~6 months
    ...Array.from({ length: 30 }, (_, i) => ({
      org_id: ORG_ID,
      meeting_date: date(i * 6 + 1),
      meeting_time: pick(times, i),
      representative_id: pick(reps, i).id,
      congressional_contact_id:
        staffers?.[i % (staffers?.length ?? 1)]?.id ?? null,
      primary_team_id: teams?.[i % (teams?.length ?? 1)]?.id ?? null,
      location_json: pick(locations, i),
      notes: i % 4 === 0 ? "Discuss global health funding priorities." : null,
      follow_up_date: null,
      follow_up_completed: false,
      champion_score: i % 6 === 0 ? null : (i % 5) + 1,
      links:
        i % 3 === 0
          ? [{ label: "PIH One-Pager", url: "https://pih.org/one-pager" }]
          : [],
      created_by: createdBy,
    })),
    // 30 past meetings spread over the last ~6 months
    ...Array.from({ length: 30 }, (_, i) => ({
      org_id: ORG_ID,
      meeting_date: date(-(i * 6 + 1)),
      meeting_time: pick(times, i + 3),
      representative_id: pick(reps, i + 15).id,
      congressional_contact_id:
        staffers?.[i % (staffers?.length ?? 1)]?.id ?? null,
      primary_team_id: teams?.[i % (teams?.length ?? 1)]?.id ?? null,
      location_json: pick(locations, i + 2),
      notes:
        i % 3 === 0 ? "Discussed FY2026 global health appropriations." : null,
      follow_up_date: i % 4 === 0 ? date(-(i * 6 - 3)) : null,
      follow_up_completed: i % 4 === 0,
      champion_score: i % 5 === 0 ? null : (i % 5) + 1,
      links: [],
      created_by: createdBy,
    })),
  ];

  const { error: insertError } = await supabase
    .from("meetings")
    .insert(meetings);
  if (insertError) throw new Error(`Insert failed: ${insertError.message}`);

  const todayStr = today.toISOString().slice(0, 10);
  const upcoming = meetings.filter((m) => m.meeting_date >= todayStr);
  const past = meetings.filter((m) => m.meeting_date < todayStr);
  console.log(`\nInserted ${meetings.length} meetings:`);
  console.log(`  Upcoming: ${upcoming.length}`);
  console.log(`  Past:     ${past.length}`);
  console.log("\nDone!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
