import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { TEST_USER_ID } from "./seed";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

test.describe("user profile auto-assignment", () => {
  test("test user has a profile row in the pihe org", async () => {
    const supabase = adminClient();

    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("role, org_id")
      .eq("user_id", TEST_USER_ID)
      .single();

    expect(profileError).toBeNull();
    expect(profile?.role).toBe("member");
    expect(profile?.org_id).toBeTruthy();

    const { data: org } = await supabase
      .from("organizations")
      .select("slug")
      .eq("id", profile!.org_id!)
      .single();
    expect(org?.slug).toBe("pihe");
  });

  test("newly created users are auto-assigned to pihe as members", async () => {
    const supabase = adminClient();
    const email = `trigger-test-${Date.now()}@example.com`;

    const { data: created, error: createError } =
      await supabase.auth.admin.createUser({
        email,
        password: "Playwright1!",
        email_confirm: true,
      });
    expect(createError).toBeNull();
    const newId = created.user!.id;

    try {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("role, org_id, organizations(slug)")
        .eq("user_id", newId)
        .single<{
          role: string;
          org_id: string | null;
          organizations: { slug: string } | null;
        }>();

      expect(profile?.role).toBe("member");
      expect(profile?.organizations?.slug).toBe("pihe");
    } finally {
      await supabase.auth.admin.deleteUser(newId);
    }
  });
});
