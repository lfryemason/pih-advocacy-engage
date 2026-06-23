import { test, expect } from "@playwright/test";
import { AUTH_STATE_PATH } from "../global-setup";
import { resetDatabase } from "../reset-db";
import { themes, setTheme } from "./theme-utils";

test.use({ storageState: AUTH_STATE_PATH });
test.beforeEach(resetDatabase);

for (const theme of themes) {
  test.describe(`homepage (${theme})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("load");
      await setTheme(page, theme);
    });

    test("matches screenshot", async ({ page }) => {
      await expect(page).toHaveScreenshot(`homepage-${theme}.png`, {
        fullPage: true,
      });
    });
  });
}
