import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { AUTH_STATE_PATH } from "./global-setup";
import { resetDatabase } from "./reset-db";
import { SEED_PLACEHOLDER_EMAIL, TEST_USER_ID } from "./seed";

const MAILPIT_URL = "http://127.0.0.1:54324";

function adminClient() {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required.");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321",
    key,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

/** Poll Mailpit for the newest confirmation link sent to `email`. */
async function fetchConfirmLink(email: string): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const res = await fetch(
      `${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`,
    );
    const data = (await res.json()) as { messages: { ID: string }[] };
    if (data.messages.length > 0) {
      const msg = (await (
        await fetch(`${MAILPIT_URL}/api/v1/message/${data.messages[0].ID}`)
      ).json()) as { HTML: string; Text: string };
      const match =
        (msg.HTML ?? "").match(/href="([^"]*auth\/confirm[^"]*)"/) ??
        (msg.Text ?? "").match(/(http\S*auth\/confirm\S*)/);
      if (match) return match[1].replace(/&amp;/g, "&");
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No confirmation email arrived for ${email}`);
}

test.describe("placeholder teammates (signed in)", () => {
  test.use({ storageState: AUTH_STATE_PATH });
  test.beforeEach(resetDatabase);

  test("seeded placeholder shows a Pending badge on the team page", async ({
    page,
  }) => {
    await page.goto("/teams/haverford-bryn-mawr-college");
    await expect(page.getByText("Penny Placeholder")).toBeVisible();
    await expect(page.getByText("Pending", { exact: true })).toBeVisible();
  });

  test("add teammate dialog creates a placeholder with a Pending badge", async ({
    page,
  }) => {
    // Unique email: non-seed auth users survive resetDatabase, so a fixed
    // address would collide on re-runs.
    const email = `dana-${Date.now()}@example.com`;
    await page.goto("/teams/haverford-bryn-mawr-college/edit");
    await page.getByRole("button", { name: "Add teammate" }).click();

    const dialog = page.getByRole("dialog", { name: "Add teammate" });
    await dialog.getByLabel("Email").fill(email);
    await dialog.getByLabel("First Name").fill("Dana");
    await dialog.getByLabel("Last Name").fill("Dialog");
    await dialog.getByRole("button", { name: "Add teammate" }).click();

    await expect(dialog).not.toBeVisible();
    const row = page.getByRole("row", { name: /Dana Dialog/ });
    await expect(row).toBeVisible();
    await expect(row.getByText("Pending", { exact: true })).toBeVisible();
  });

  test("validation: a name is required", async ({ page }) => {
    await page.goto("/teams/haverford-bryn-mawr-college/edit");
    await page.getByRole("button", { name: "Add teammate" }).click();

    const dialog = page.getByRole("dialog", { name: "Add teammate" });
    await dialog.getByLabel("Email").fill("nameless@example.com");
    await dialog.getByRole("button", { name: "Add teammate" }).click();

    await expect(dialog.getByRole("alert")).toHaveText(
      "A first or last name is required.",
    );
  });

  test("add teammate is hidden on a team the user is not a member of", async ({
    page,
  }) => {
    // The test user has no membership on Portland University.
    await page.goto("/teams/portland-university/edit");
    await expect(page.getByText("Members", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Add teammate" }),
    ).not.toBeVisible();
  });

  test("placeholder can be edited from the team edit page", async ({
    page,
  }) => {
    await page.goto("/teams/haverford-bryn-mawr-college/edit");
    await page
      .getByRole("button", { name: "Edit placeholder teammate" })
      .click();

    const dialog = page.getByRole("dialog", { name: "Edit teammate" });
    await expect(dialog.getByLabel("Email")).toHaveValue(
      SEED_PLACEHOLDER_EMAIL,
    );
    await expect(dialog.getByLabel("Email")).toBeDisabled();

    await dialog.getByLabel("First Name").fill("Penelope");
    await dialog.getByRole("button", { name: "Save changes" }).click();

    await expect(dialog).not.toBeVisible();
    await expect(page.getByText("Penelope Placeholder")).toBeVisible();
  });

  test("placeholder can be removed from the team", async ({ page }) => {
    page.on("dialog", (d) => d.accept());
    await page.goto("/teams/haverford-bryn-mawr-college/edit");
    await page
      .getByRole("button", {
        name: "Remove Penny Placeholder from team",
      })
      .click();
    await expect(page.getByText("Penny Placeholder")).not.toBeVisible();
  });

  test("hard delete is hidden from members and works for org admins", async ({
    page,
  }) => {
    await page.goto("/teams/haverford-bryn-mawr-college/edit");
    await expect(page.getByText("Penny Placeholder")).toBeVisible();
    // Regular member: no hard-delete button.
    await expect(
      page.getByRole("button", {
        name: /Permanently delete Penny Placeholder/,
      }),
    ).not.toBeVisible();

    // Promote the test user to org_admin (restored by the next reset).
    const admin = adminClient();
    const { error } = await admin
      .from("user_role")
      .update({ role: "org_admin" })
      .eq("user_id", TEST_USER_ID);
    expect(error).toBeNull();

    page.on("dialog", (d) => d.accept("DELETE"));
    await page.reload();
    await page
      .getByRole("button", {
        name: /Permanently delete Penny Placeholder/,
      })
      .click();
    await expect(page.getByText("Penny Placeholder")).not.toBeVisible();

    // The auth user is gone, not just the membership.
    const { data } = await admin
      .from("profiles")
      .select("user_id")
      .eq("email", SEED_PLACEHOLDER_EMAIL);
    expect(data).toEqual([]);
  });
});

test.describe("claiming a placeholder account", () => {
  // Signed-out: the real person arrives at the public signup form.
  test.use({ storageState: { cookies: [], origins: [] } });
  test.beforeEach(resetDatabase);

  test("sign up with the placeholder email → confirm → memberships intact", async ({
    page,
  }) => {
    const password = "ClaimedPass1!";

    // Clear old mail so we pick up the fresh confirmation message.
    await fetch(`${MAILPIT_URL}/api/v1/messages`, { method: "DELETE" });

    // Sign up with details that differ from the seeded placeholder
    // ("Penny Placeholder", she/her): the claimer's own input must win.
    await page.goto("/auth/sign-up");
    await page.getByLabel("First Name").fill("Penelope");
    await page.getByLabel("Last Name").fill("Reclaimed");
    await page.getByLabel("Pronouns").fill("they/them");
    await page.getByLabel("Email").fill(SEED_PLACEHOLDER_EMAIL);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByLabel("Repeat Password").fill(password);
    await page.getByRole("button", { name: "Sign up" }).click();
    await page.waitForURL("**/auth/sign-up-success");

    // The confirmation email is the security boundary: the staged password
    // is inert until this link is clicked.
    const confirmLink = await fetchConfirmLink(SEED_PLACEHOLDER_EMAIL);
    await page.goto(confirmLink);
    await page.waitForURL((url) => !url.pathname.startsWith("/auth/"));

    // Log in with the claimed password on the app origin.
    await page.goto("/auth/login");
    await page.getByLabel("Email").fill(SEED_PLACEHOLDER_EMAIL);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Login" }).click();
    await page.waitForURL((url) => !url.pathname.startsWith("/auth/"));

    // Membership carried over (same user_id), the claimer's signup details
    // overwrote the placeholder's, and the Pending badge is gone. Scope to
    // the roster row: the sidebar also shows the name now that they are the
    // signed-in user.
    await page.goto("/teams/haverford-bryn-mawr-college");
    const row = page.getByRole("row", { name: /Penelope Reclaimed/ });
    await expect(row).toBeVisible({ timeout: 15000 });
    await expect(row.getByText("they/them")).toBeVisible();
    await expect(row.getByText("Pending", { exact: true })).not.toBeVisible();
    await expect(page.getByText("Penny Placeholder")).not.toBeVisible();
  });
});
