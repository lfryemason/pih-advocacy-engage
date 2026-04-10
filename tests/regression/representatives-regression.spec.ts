import { test, expect } from "@playwright/test";
import { AUTH_STATE_PATH } from "../global-setup";

test.use({ storageState: AUTH_STATE_PATH });

const themes = ["light", "dark"] as const;

for (const theme of themes) {
  test.describe(`representatives page (${theme})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((t) => {
        window.localStorage.setItem("theme", t);
      }, theme);
      await page.goto("/representatives");
      await page.waitForFunction(
        (t) => document.documentElement.classList.contains(t),
        theme,
      );
    });

    test("matches screenshot", async ({ page }) => {
      await expect(page).toHaveScreenshot(`representatives-${theme}.png`);
    });
  });
}
