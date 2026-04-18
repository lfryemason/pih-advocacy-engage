import { createClient } from "@supabase/supabase-js";
import {
  TEST_USER_ID,
  TEST_EMAIL,
  TEST_PASSWORD,
  SEED_REPRESENTATIVES,
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
  const { data } = await supabase.auth.admin.getUserById(TEST_USER_ID);

  if (!data.user) {
    await supabase.auth.admin.createUser({
      id: TEST_USER_ID,
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: {},
    });
  }
}

/** Reset user metadata and representatives table to seed state. */
export async function resetDatabase() {
  const supabase = adminClient();

  // Reset user metadata
  await supabase.auth.admin.updateUserById(TEST_USER_ID, {
    user_metadata: {},
  });

  // Reset representatives table to seed state (upsert without delete to
  // avoid race conditions with parallel workers)
  const { error: upsertError } = await supabase
    .from("representatives")
    .upsert(SEED_REPRESENTATIVES, { onConflict: "bioguide_id" });
  if (upsertError)
    throw new Error(`Failed to seed representatives: ${upsertError.message}`);
}
