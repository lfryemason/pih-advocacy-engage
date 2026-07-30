import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { AUTH_STATE_PATH } from "../global-setup";
import { resetDatabase } from "../reset-db";
import { SEED_MEETING_UPCOMING_ID, SEED_MEETING_PAST_ID } from "../seed";
import { themes, setTheme } from "./theme-utils";

test.use({ storageState: AUTH_STATE_PATH });

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Give the two seed meetings distinct locations so the list row, detail panel,
// and edit form screenshots capture a populated location field. resetDatabase
// re-seeds both meetings with a null location first, so these updates are
// deterministic.
async function seedMeetingLocations() {
  const supabase = adminClient();
  const updates = [
    {
      id: SEED_MEETING_UPCOMING_ID,
      location: "District Office, 605 2nd Ave, Seattle, WA",
    },
    {
      id: SEED_MEETING_PAST_ID,
      location: "Cannon House Office Building, Washington, DC",
    },
  ];
  for (const { id, location } of updates) {
    const { error } = await supabase
      .from("meetings")
      .update({ location })
      .eq("id", id);
    if (error)
      throw new Error(`Failed to seed meeting location: ${error.message}`);
  }
}

test.beforeEach(async () => {
  await resetDatabase();
  await seedMeetingLocations();
});

for (const theme of themes) {
  test.describe(`meetings list page (${theme})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/meetings");
      await page.waitForLoadState("networkidle");
      await setTheme(page, theme);
    });

    test("matches screenshot", async ({ page }) => {
      await expect(page).toHaveScreenshot(`meetings-list-${theme}.png`);
    });
  });

  test.describe(`meeting detail panel — expanded row (${theme})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/meetings");
      await page.waitForLoadState("networkidle");
      await setTheme(page, theme);
      await page.getByRole("tab", { name: "All Meetings" }).click();
      const expandBtn = page
        .getByRole("button", { name: /Expand meeting with/ })
        .first();
      await expandBtn.click();
      await expect(
        page.getByRole("button", { name: /Edit Meeting/i }),
      ).toBeVisible();
    });

    test("matches screenshot", async ({ page }) => {
      await expect(page).toHaveScreenshot(`meetings-detail-${theme}.png`);
    });
  });

  test.describe(`meeting edit form (${theme})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/meetings");
      await page.waitForLoadState("networkidle");
      await setTheme(page, theme);
      await page.getByRole("tab", { name: "All Meetings" }).click();
      const expandBtn = page
        .getByRole("button", { name: /Expand meeting with/ })
        .first();
      await expandBtn.click();
      await page.getByRole("button", { name: /Edit Meeting/i }).click();
      await expect(
        page.getByRole("button", { name: "Save changes" }),
      ).toBeVisible();
    });

    test("matches screenshot", async ({ page }) => {
      await expect(page).toHaveScreenshot(`meetings-edit-${theme}.png`);
    });
  });

  test.describe(`delegation form section (${theme})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/meetings");
      await page.waitForLoadState("networkidle");
      await setTheme(page, theme);
      await page.getByRole("tab", { name: "All Meetings" }).click();
      const expandBtn = page
        .getByRole("button", { name: /Expand meeting with/ })
        .first();
      await expandBtn.click();
      await page.getByRole("button", { name: /Edit Meeting/i }).click();
      await expect(
        page.getByRole("button", { name: "Save changes" }),
      ).toBeVisible();
      await page.getByRole("button", { name: /Add member/i }).click();
      const searchInput = page.getByRole("combobox", {
        name: /search members/i,
      });
      await searchInput.scrollIntoViewIfNeeded();
    });

    test("matches screenshot", async ({ page }) => {
      await expect(page).toHaveScreenshot(`meetings-delegation-${theme}.png`);
    });
  });
}
