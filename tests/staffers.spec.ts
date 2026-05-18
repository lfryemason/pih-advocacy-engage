import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { AUTH_STATE_PATH } from "./global-setup";
import { resetDatabase } from "./reset-db";
import { TEST_USER_ID } from "./seed";

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

async function promoteToOrgAdmin() {
  const supabase = adminClient();
  const { error } = await supabase
    .from("user_role")
    .upsert(
      { user_id: TEST_USER_ID, role: "org_admin", org_id: "pihe" },
      { onConflict: "user_id" },
    );
  if (error) throw new Error(`Failed to promote test user: ${error.message}`);
}

async function seedStafferFor(bioguideId: string) {
  const supabase = adminClient();
  const { data: rep } = await supabase
    .from("representatives")
    .select("id")
    .eq("bioguide_id", bioguideId)
    .single();
  if (!rep) throw new Error(`seed rep ${bioguideId} missing`);

  const { error } = await supabase.from("staffers").insert({
    representative_id: rep.id,
    org_id: "pihe",
    first_name: "Existing",
    last_name: "Staffer",
    title: "Aide",
  });
  if (error) throw new Error(`Failed to seed staffer: ${error.message}`);
}

test.beforeEach(resetDatabase);

test.describe("staffers on rep detail page", () => {
  test("page renders the staffer section", async ({ page }) => {
    await page.goto("/representatives/S000001");
    await expect(page.getByRole("heading", { name: "Staffers" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Staffer", exact: true }),
    ).toBeVisible();
  });

  test("member can add a staffer and see it appear", async ({ page }) => {
    await page.goto("/representatives/S000001");
    await page.getByRole("button", { name: "Staffer", exact: true }).click();
    await page.getByLabel("First name").fill("Sam");
    await page.getByLabel("Last name").fill("Jones");
    await page.getByLabel("Title").fill("Chief of Staff");
    await page.getByLabel("Pronouns").fill("they/them");
    await page.getByRole("button", { name: "Add staffer" }).click();

    await expect(page.getByText("Sam Jones")).toBeVisible();
    await expect(page.getByText("Chief of Staff")).toBeVisible();
    await expect(page.getByText("(they/them)")).toBeVisible();
  });

  test("member can edit a staffer", async ({ page }) => {
    await seedStafferFor("S000001");
    await page.goto("/representatives/S000001");

    await expect(page.getByText("Existing Staffer")).toBeVisible();
    await page.getByRole("button", { name: "Edit staffer" }).click();
    await page.getByLabel("First name").fill("Updated");
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText("Updated Staffer")).toBeVisible();
  });

  test("member does not see the delete button", async ({ page }) => {
    await seedStafferFor("S000001");
    await page.goto("/representatives/S000001");
    await expect(page.getByText("Existing Staffer")).toBeVisible();
    await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0);
  });

  test("org admin can delete a staffer", async ({ page }) => {
    await promoteToOrgAdmin();
    await seedStafferFor("S000001");
    await page.goto("/representatives/S000001");

    await expect(page.getByText("Existing Staffer")).toBeVisible();

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete" }).click();

    await expect(page.getByText("Existing Staffer")).toHaveCount(0);
  });

  test("staffer is scoped to the chosen representative", async ({ page }) => {
    await seedStafferFor("S000001");
    // Different rep — should not show the staffer
    await page.goto("/representatives/S000002");
    await expect(page.getByRole("heading", { name: "Staffers" })).toBeVisible();
    await expect(page.getByText("Existing Staffer")).toHaveCount(0);
  });
});
