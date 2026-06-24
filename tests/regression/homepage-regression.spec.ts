import { test, expect } from "@playwright/test";
import { AUTH_STATE_PATH } from "../global-setup";
import { resetDatabase } from "../reset-db";
import { themes, setTheme } from "./theme-utils";

test.use({ storageState: AUTH_STATE_PATH });
test.beforeEach(resetDatabase);

for (const theme of themes) {
  test.describe(`homepage (${theme})`, () => {
    test.beforeEach(async ({ page }) => {
      // Pre-seed localStorage so next-themes applies the correct class on first
      // mount instead of racing with our post-load classList manipulation.
      await page.addInitScript((t) => {
        localStorage.setItem("theme", t);
      }, theme);
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await setTheme(page, theme);
    });

    test("matches screenshot", async ({ page }) => {
      await expect(page).toHaveScreenshot(`homepage-${theme}.png`, {
        fullPage: true,
      });
    });
  });
}
