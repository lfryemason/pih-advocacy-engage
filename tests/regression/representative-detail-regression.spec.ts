import { test, expect, Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { AUTH_STATE_PATH } from "../global-setup";
import { resetDatabase } from "../reset-db";

test.use({ storageState: AUTH_STATE_PATH });

const themes = ["light", "dark"] as const;
type Theme = (typeof themes)[number];

async function setTheme(page: Page, theme: Theme) {
  await page.evaluate((t) => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(t);
    document.documentElement.style.colorScheme = t;
  }, theme);
}

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Insert one known staffer for S000001 so the screenshot captures a populated
// list. resetDatabase clears all staffers first, so this is deterministic.
async function seedStaffer() {
  const supabase = adminClient();
  const { data: rep, error: repError } = await supabase
    .from("representatives")
    .select("id")
    .eq("bioguide_id", "S000001")
    .single();
  if (repError || !rep)
    throw new Error("seed rep S000001 missing for staffer regression");

  const { error } = await supabase.from("staffers").insert({
    representative_id: rep.id,
    org_id: "pihe",
    first_name: "Sam",
    last_name: "Jones",
    title: "Chief of Staff",
    pronouns: "they/them",
    email: "sam@example.com",
    notes: "Primary contact for **healthcare** policy.",
  });
  if (error) throw new Error(`Failed to seed staffer: ${error.message}`);
}

test.beforeEach(async () => {
  await resetDatabase();
  await seedStaffer();
});

for (const theme of themes) {
  test.describe(`representative detail page (${theme})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/representatives/S000001");
      await page.waitForLoadState("networkidle");
      await setTheme(page, theme);
    });

    test("matches screenshot", async ({ page }) => {
      await expect(page).toHaveScreenshot(`representative-detail-${theme}.png`);
    });
  });
}
