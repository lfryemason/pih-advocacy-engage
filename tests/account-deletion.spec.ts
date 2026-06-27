import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { SEED_REP_WA_BIOGUIDE, SEED_TEAM_ID } from "./seed";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";

function adminClient() {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");
  return createClient(SUPABASE_URL, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function userClient() {
  const key =
    process.env.ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!key) throw new Error("ANON_KEY missing");
  return createClient(SUPABASE_URL, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

test.describe("self-serve account deletion", () => {
  test("deletes the user and cascades their rows, but keeps their meetings with created_by nulled", async () => {
    const admin = adminClient();
    const email = `delete-test-${Date.now()}@example.com`;
    const password = "Playwright1!";

    // handle_new_user trigger creates the user_role + profile rows for us.
    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
    expect(createError).toBeNull();
    const userId = created.user!.id;

    let meetingId: string | undefined;
    try {
      // A team membership — should cascade-delete with the account.
      const { error: tmError } = await admin.from("team_memberships").insert({
        team_id: SEED_TEAM_ID,
        user_id: userId,
        org_id: "pihe",
        role: "member",
      });
      expect(tmError).toBeNull();

      // A meeting they logged — must survive deletion with created_by cleared.
      const { data: rep } = await admin
        .from("representatives")
        .select("id")
        .eq("bioguide_id", SEED_REP_WA_BIOGUIDE)
        .single();
      const { data: meeting, error: mError } = await admin
        .from("meetings")
        .insert({
          org_id: "pihe",
          meeting_date: "2099-01-01",
          representative_id: rep!.id,
          created_by: userId,
        })
        .select("id")
        .single();
      expect(mError).toBeNull();
      meetingId = meeting!.id;

      // Sign in as the user and delete their own account via the RPC.
      const user = userClient();
      const { error: signInError } = await user.auth.signInWithPassword({
        email,
        password,
      });
      expect(signInError).toBeNull();
      const { error: rpcError } = await user.rpc("delete_own_account");
      expect(rpcError).toBeNull();

      // Auth user is gone.
      const { data: lookedUp } = await admin.auth.admin.getUserById(userId);
      expect(lookedUp.user).toBeFalsy();

      // Cascaded rows are gone.
      const { data: profileRow } = await admin
        .from("profiles")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();
      expect(profileRow).toBeNull();

      const { data: membershipRow } = await admin
        .from("team_memberships")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();
      expect(membershipRow).toBeNull();

      // Meeting is preserved; authorship link is cleared.
      const { data: meetingRow } = await admin
        .from("meetings")
        .select("id, created_by")
        .eq("id", meetingId)
        .single();
      expect(meetingRow?.id).toBe(meetingId);
      expect(meetingRow?.created_by).toBeNull();
    } finally {
      if (meetingId) {
        await admin.from("meetings").delete().eq("id", meetingId);
      }
      await admin.auth.admin.deleteUser(userId);
    }
  });
});
