import { test, expect } from "@playwright/test";
import { AUTH_STATE_PATH } from "./global-setup";
import { resetDatabase } from "./reset-db";

test.use({ storageState: AUTH_STATE_PATH });
test.beforeEach(resetDatabase);

test.describe("My Representatives section", () => {
  test("shows representatives matching the user's profile state and district", async ({
    page,
  }) => {
    await page.goto("/representatives");
    // Seed profile: WA, district 9 — matches W000001 (senator) and W000002 (rep)
    await expect(page.getByText("Susan Collins")).toBeVisible();
    await expect(page.getByText("Adam Smith")).toBeVisible();
  });

  test("shows message when profile has no state set", async ({ page }) => {
    // Clear state/district from profile via the profile page
    await page.goto("/profile");
    await page.getByLabel(/State/).selectOption("");
    await page.getByRole("button", { name: "Save" }).click();

    await page.goto("/representatives");
    await expect(page.getByText(/Set your state and district/)).toBeVisible();
  });
});
