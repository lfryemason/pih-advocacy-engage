import { test, expect, Page } from "@playwright/test";
import { AUTH_STATE_PATH } from "../global-setup";
import { resetDatabase } from "../reset-db";

test.use({ storageState: AUTH_STATE_PATH });
test.beforeEach(resetDatabase);

const themes = ["light", "dark"] as const;
type Theme = (typeof themes)[number];

async function setTheme(page: Page, theme: Theme) {
  await page.evaluate((t) => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(t);
    document.documentElement.style.colorScheme = t;
  }, theme);
  // Wait for CSS transitions and theme styles to be fully applied
  await page.waitForTimeout(500);
}

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
