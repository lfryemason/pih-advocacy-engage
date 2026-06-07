import { createClient } from "@supabase/supabase-js";
import {
  TEST_USER_ID,
  TEST_EMAIL,
  TEST_PASSWORD,
  SEED_REPRESENTATIVES,
  SEED_PROFILE,
  SEED_EXTRA_PROFILES,
  SEED_TEAMS,
  SEED_TEAM_MEMBERSHIPS,
  SEED_TEAM_ID,
  SEED_TEAM_NO_MEMBER_ID,
  SEED_TEAM_HMC_ID,
  SEED_MEETING_UPCOMING_ID,
  SEED_MEETING_PAST_ID,
  SEED_REP_WA_BIOGUIDE,
  SEED_USER_2_ID,
  SEED_USER_3_ID,
  SEED_USER_4_ID,
  SEED_USER_5_ID,
} from "./seed";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";

function adminClient() {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required. " +
        'Run: eval "$(npx supabase status -o env)" to set it locally.',
    );
  }
  return createClient(SUPABASE_URL, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const EXTRA_USERS = [
  { id: SEED_USER_2_ID, email: "user2@example.com" },
  { id: SEED_USER_3_ID, email: "user3@example.com" },
  { id: SEED_USER_4_ID, email: "user4@example.com" },
  { id: SEED_USER_5_ID, email: "user5@example.com" },
];

/** Ensure the test user and extra seed users exist, creating them if needed. */
export async function seedTestUser() {
  const supabase = adminClient();

  for (const { id, email } of [
    { id: TEST_USER_ID, email: TEST_EMAIL },
    ...EXTRA_USERS,
  ]) {
    const { data, error: getError } = await supabase.auth.admin.getUserById(id);

    if (getError && getError.status !== 404) {
      throw new Error(`Failed to look up user ${id}: ${getError.message}`);
    }

    if (!data?.user) {
      const { error: createError } = await supabase.auth.admin.createUser({
        id,
        email,
        password: TEST_PASSWORD,
        email_confirm: true,
        user_metadata: {},
      });
      if (createError) {
        throw new Error(`Failed to create user ${id}: ${createError.message}`);
      }
    }
  }
}

/** Reset profile, role, representatives, and staffers to seed state. */
export async function resetDatabase() {
  const supabase = adminClient();

  // Reset primary test user profile
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(SEED_PROFILE, { onConflict: "user_id" });
  if (profileError) {
    throw new Error(
      `Failed to reset test user profile: ${profileError.message}`,
    );
  }

  // Upsert extra seed profiles
  const { error: extraProfileError } = await supabase
    .from("profiles")
    .upsert(SEED_EXTRA_PROFILES, { onConflict: "user_id" });
  if (extraProfileError) {
    throw new Error(
      `Failed to upsert extra profiles: ${extraProfileError.message}`,
    );
  }

  // Reset the test user's role to member of pihe.
  const { error: roleError } = await supabase
    .from("user_role")
    .upsert(
      { user_id: TEST_USER_ID, role: "member", org_id: "pihe" },
      { onConflict: "user_id" },
    );
  if (roleError) {
    throw new Error(`Failed to reset test user role: ${roleError.message}`);
  }

  // Reset representatives table to seed state.
  const seedIds = SEED_REPRESENTATIVES.map((r) => r.bioguide_id);
  const { error: deleteError } = await supabase
    .from("representatives")
    .delete()
    .not("bioguide_id", "in", `(${seedIds.join(",")})`);
  if (deleteError) {
    throw new Error(
      `Failed to clear non-seed representatives: ${deleteError.message}`,
    );
  }

  const { error: upsertError } = await supabase
    .from("representatives")
    .upsert(SEED_REPRESENTATIVES, { onConflict: "bioguide_id" });
  if (upsertError) {
    throw new Error(`Failed to seed representatives: ${upsertError.message}`);
  }

  // Staffers have no seed set — wipe everything between tests.
  const { error: stafferError } = await supabase
    .from("staffers")
    .delete()
    .not("id", "is", null);
  if (stafferError) {
    throw new Error(`Failed to clear staffers: ${stafferError.message}`);
  }

  // Reset team_memberships: wipe all non-seed memberships, then restore seed.
  const seedTeamIds = [SEED_TEAM_ID, SEED_TEAM_NO_MEMBER_ID, SEED_TEAM_HMC_ID];
  const { error: membershipDeleteError } = await supabase
    .from("team_memberships")
    .delete()
    .not("team_id", "in", `(${seedTeamIds.join(",")})`);
  if (membershipDeleteError) {
    throw new Error(
      `Failed to clear non-seed team memberships: ${membershipDeleteError.message}`,
    );
  }
  const { error: extraMembershipError } = await supabase
    .from("team_memberships")
    .delete()
    .in("team_id", seedTeamIds);
  if (extraMembershipError) {
    throw new Error(
      `Failed to clear seed-team memberships: ${extraMembershipError.message}`,
    );
  }

  // Reset teams: delete non-seed teams, restore seed teams via UPDATE.
  const { error: teamDeleteError } = await supabase
    .from("teams")
    .delete()
    .not("id", "in", `(${seedTeamIds.join(",")})`);
  if (teamDeleteError) {
    throw new Error(
      `Failed to clear non-seed teams: ${teamDeleteError.message}`,
    );
  }
  for (const { id, ...fields } of SEED_TEAMS) {
    const { data: updated, error: updateError } = await supabase
      .from("teams")
      .update(fields)
      .eq("id", id)
      .select("id");
    if (updateError) {
      throw new Error(
        `Failed to update seed team ${id}: ${updateError.message}`,
      );
    }
    if (!updated || updated.length === 0) {
      const { error: insertError } = await supabase
        .from("teams")
        .insert({ id, ...fields });
      if (insertError) {
        throw new Error(
          `Failed to insert seed team ${id}: ${insertError.message}`,
        );
      }
    }
  }

  // Restore seed team memberships.
  const { error: membershipUpsertError } = await supabase
    .from("team_memberships")
    .upsert(SEED_TEAM_MEMBERSHIPS, { onConflict: "team_id,user_id,role" });
  if (membershipUpsertError) {
    throw new Error(
      `Failed to seed team memberships: ${membershipUpsertError.message}`,
    );
  }

  // Wipe all meetings (cascade removes delegation members) and re-seed.
  const { error: meetingDeleteError } = await supabase
    .from("meetings")
    .delete()
    .not("id", "is", null);
  if (meetingDeleteError) {
    throw new Error(`Failed to clear meetings: ${meetingDeleteError.message}`);
  }

  // Look up the UUID of the seeded WA representative (Adam Smith, W000002).
  const { data: repRow, error: repLookupError } = await supabase
    .from("representatives")
    .select("id")
    .eq("bioguide_id", SEED_REP_WA_BIOGUIDE)
    .single();
  if (repLookupError || !repRow) {
    throw new Error(
      `Failed to look up seed representative: ${repLookupError?.message ?? "not found"}`,
    );
  }

  const seedMeetings = [
    {
      id: SEED_MEETING_UPCOMING_ID,
      org_id: "pihe",
      meeting_date: "2099-06-01",
      representative_id: repRow.id,
      created_by: TEST_USER_ID,
      primary_team_id: SEED_TEAM_ID,
    },
    {
      id: SEED_MEETING_PAST_ID,
      org_id: "pihe",
      meeting_date: "2020-01-15",
      representative_id: repRow.id,
      created_by: TEST_USER_ID,
    },
  ];

  const { error: meetingInsertError } = await supabase
    .from("meetings")
    .insert(seedMeetings);
  if (meetingInsertError) {
    throw new Error(`Failed to seed meetings: ${meetingInsertError.message}`);
  }
}
