import { createClient } from "@supabase/supabase-js";
import {
  TEST_USER_ID,
  TEST_EMAIL,
  TEST_PASSWORD,
  SEED_REPRESENTATIVES,
  SEED_PROFILE,
  SEED_TEAMS,
  SEED_TEAM_MEMBERSHIPS,
  SEED_TEAM_ID,
  SEED_TEAM_NO_MEMBER_ID,
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

/** Ensure the test user exists, creating it if needed. */
export async function seedTestUser() {
  const supabase = adminClient();
  const { data, error: getError } =
    await supabase.auth.admin.getUserById(TEST_USER_ID);

  // 404 = user doesn't exist yet; any other error is a real failure
  if (getError && getError.status !== 404) {
    throw new Error(`Failed to look up test user: ${getError.message}`);
  }

  if (!data?.user) {
    const { error: createError } = await supabase.auth.admin.createUser({
      id: TEST_USER_ID,
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: {},
    });
    if (createError) {
      throw new Error(`Failed to create test user: ${createError.message}`);
    }
  }
}

/** Reset profile, role, representatives, and staffers to seed state. */
export async function resetDatabase() {
  const supabase = adminClient();

  // Reset the test user's profile to the seed state (blank name/pronouns/state
  // so profile tests always start from a known clean slate).
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(SEED_PROFILE, { onConflict: "user_id" });
  if (profileError) {
    throw new Error(
      `Failed to reset test user profile: ${profileError.message}`,
    );
  }

  // Reset the test user's role to member of pihe. The auth trigger creates
  // this row on user insert; the upsert here ensures tests that promote the
  // user to org_admin/super_admin don't leak state across runs.
  const { error: roleError } = await supabase
    .from("user_role")
    .upsert(
      { user_id: TEST_USER_ID, role: "member", org_id: "pihe" },
      { onConflict: "user_id" },
    );
  if (roleError) {
    throw new Error(`Failed to reset test user role: ${roleError.message}`);
  }

  // Reset representatives table to seed state. We only delete rows NOT in the
  // seed set (safe for parallel workers — never touches the seed rows), then
  // upsert to restore any seed rows that a test may have modified.
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

  // Staffers have no seed set — wipe everything between tests so suites that
  // create staffers don't leak state. Filter is `id is not null` (matches all).
  const { error: stafferError } = await supabase
    .from("staffers")
    .delete()
    .not("id", "is", null);
  if (stafferError) {
    throw new Error(`Failed to clear staffers: ${stafferError.message}`);
  }

  // Reset team_memberships: wipe all non-seed memberships, then restore seed.
  const seedTeamIds = [SEED_TEAM_ID, SEED_TEAM_NO_MEMBER_ID];
  const { error: membershipDeleteError } = await supabase
    .from("team_memberships")
    .delete()
    .not("team_id", "in", `(${seedTeamIds.join(",")})`);
  if (membershipDeleteError) {
    throw new Error(
      `Failed to clear non-seed team memberships: ${membershipDeleteError.message}`,
    );
  }
  // Also wipe any extra memberships on the seed teams (e.g. from join-team tests).
  const { error: extraMembershipError } = await supabase
    .from("team_memberships")
    .delete()
    .in("team_id", seedTeamIds)
    .neq("user_id", TEST_USER_ID);
  if (extraMembershipError) {
    throw new Error(
      `Failed to clear extra seed-team memberships: ${extraMembershipError.message}`,
    );
  }
  // Also remove the test user's membership on the no-member team (from join tests).
  await supabase
    .from("team_memberships")
    .delete()
    .eq("team_id", SEED_TEAM_NO_MEMBER_ID)
    .eq("user_id", TEST_USER_ID);

  // Reset teams: delete non-seed teams, upsert seed teams.
  const { error: teamDeleteError } = await supabase
    .from("teams")
    .delete()
    .not("id", "in", `(${seedTeamIds.join(",")})`);
  if (teamDeleteError) {
    throw new Error(
      `Failed to clear non-seed teams: ${teamDeleteError.message}`,
    );
  }
  const { error: teamUpsertError } = await supabase
    .from("teams")
    .upsert(SEED_TEAMS, { onConflict: "id" });
  if (teamUpsertError) {
    throw new Error(`Failed to seed teams: ${teamUpsertError.message}`);
  }

  // Restore seed team memberships (upsert is idempotent on the composite PK).
  const { error: membershipUpsertError } = await supabase
    .from("team_memberships")
    .upsert(SEED_TEAM_MEMBERSHIPS, { onConflict: "team_id,user_id,role" });
  if (membershipUpsertError) {
    throw new Error(
      `Failed to seed team memberships: ${membershipUpsertError.message}`,
    );
  }
}
