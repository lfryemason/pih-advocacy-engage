import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createClient } from "@supabase/supabase-js";
import { AUTH_STATE_PATH } from "./global-setup";
import { resetDatabase } from "./reset-db";
import { TEST_USER_ID } from "./seed";

test.use({ storageState: AUTH_STATE_PATH });
test.beforeEach(resetDatabase);

// The delegation member filter only renders for admins and facilitators.
async function promoteToOrgAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");
  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await supabase
    .from("user_role")
    .upsert(
      { user_id: TEST_USER_ID, role: "org_admin", org_id: "pihe" },
      { onConflict: "user_id" },
    );
  if (error) throw new Error(`Failed to promote test user: ${error.message}`);
}

const themes = ["light", "dark"] as const;

for (const theme of themes) {
  test(`meetings list page (${theme}) has no accessibility violations`, async ({
    page,
  }) => {
    await page.addInitScript((t) => {
      window.localStorage.setItem("theme", t);
    }, theme);
    await page.goto("/meetings");
    await page.waitForLoadState("networkidle");
    await page.evaluate((t) => {
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(t);
      document.documentElement.style.colorScheme = t;
    }, theme);

    const results = await new AxeBuilder({ page }).analyze();

    expect(results.violations).toEqual([]);
  });

  test(`meeting edit panel (${theme}) has no accessibility violations`, async ({
    page,
  }) => {
    await page.addInitScript((t) => {
      window.localStorage.setItem("theme", t);
    }, theme);
    await page.goto("/meetings");
    await page.waitForLoadState("networkidle");
    await page.evaluate((t) => {
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(t);
      document.documentElement.style.colorScheme = t;
    }, theme);

    // Expand a meeting row then enter edit mode so the edit form is in the DOM.
    await page.getByRole("tab", { name: "All Meetings" }).click();
    await page
      .getByRole("button", { name: /Expand meeting with/ })
      .first()
      .click();
    await page.getByRole("button", { name: /Edit Meeting/i }).click();
    await expect(
      page.getByRole("button", { name: "Save changes" }),
    ).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();

    expect(results.violations).toEqual([]);
  });

  test(`delegation panel (${theme}) has no accessibility violations`, async ({
    page,
  }) => {
    await page.addInitScript((t) => {
      window.localStorage.setItem("theme", t);
    }, theme);
    await page.goto("/meetings");
    await page.waitForLoadState("networkidle");
    await page.evaluate((t) => {
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(t);
      document.documentElement.style.colorScheme = t;
    }, theme);

    // Expand a meeting row, enter edit mode so the delegation form is in DOM.
    await page.getByRole("tab", { name: "All Meetings" }).click();
    await page
      .getByRole("button", { name: /Expand meeting with/ })
      .first()
      .click();
    await page.getByRole("button", { name: /Edit Meeting/i }).click();
    await page.getByRole("button", { name: /Add member/i }).click();
    await expect(
      page.getByRole("combobox", { name: /search members/i }),
    ).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();

    expect(results.violations).toEqual([]);
  });
}

for (const theme of themes) {
  test(`delegation member filter (${theme}) has no accessibility violations`, async ({
    page,
  }) => {
    await promoteToOrgAdmin();
    await page.addInitScript((t) => {
      window.localStorage.setItem("theme", t);
    }, theme);
    await page.goto("/meetings");
    await page.waitForLoadState("networkidle");
    await page.evaluate((t) => {
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(t);
      document.documentElement.style.colorScheme = t;
    }, theme);

    // Open the picker so the listbox and its options are scanned too.
    await page.getByRole("button", { name: /^Filters/ }).click();
    await page.getByPlaceholder("Delegation member").click();
    await expect(
      page.getByRole("option", { name: "Test Admin" }),
    ).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();

    expect(results.violations).toEqual([]);
  });
}
