import { test, expect } from "@playwright/test";
import { AUTH_STATE_PATH } from "../global-setup";
import { resetDatabase } from "../reset-db";
import { themes, setTheme } from "./theme-utils";

test.use({ storageState: AUTH_STATE_PATH });
test.beforeEach(resetDatabase);

for (const theme of themes) {
  test.describe(`teams list page (${theme})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/teams");
      await page.waitForLoadState("networkidle");
      await setTheme(page, theme);
    });

    test("matches screenshot", async ({ page }) => {
      await expect(page).toHaveScreenshot(`teams-list-${theme}.png`);
    });
  });

  test.describe(`team detail page (${theme})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/teams/seattle-high-school");
      await page.waitForLoadState("networkidle");
      await setTheme(page, theme);
    });

    test("matches screenshot", async ({ page }) => {
      await expect(page).toHaveScreenshot(`team-detail-${theme}.png`);
    });
  });

  test.describe(`team edit page (${theme})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/teams/seattle-high-school/edit");
      await page.waitForLoadState("networkidle");
      await setTheme(page, theme);
    });

    test("matches screenshot", async ({ page }) => {
      await expect(page).toHaveScreenshot(`team-edit-${theme}.png`);
    });
  });
}
