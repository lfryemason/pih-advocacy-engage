import { test, expect, Page } from "@playwright/test";
import { AUTH_STATE_PATH } from "../global-setup";

test.use({ storageState: AUTH_STATE_PATH });

const themes = ["light", "dark"] as const;
type Theme = (typeof themes)[number];

async function setTheme(page: Page, theme: Theme) {
  await page.evaluate((t) => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(t);
    document.documentElement.style.colorScheme = t;
  }, theme);
}

for (const theme of themes) {
  test.describe(`sidebar (${theme})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await setTheme(page, theme);
    });

    test("matches screenshot", async ({ page }) => {
      const sidebar = page.locator("aside");
      await expect(sidebar).toBeVisible();
      await expect(sidebar).toHaveScreenshot(`sidebar-${theme}.png`);
    });

    test("matches screenshot collapsed", async ({ page }) => {
      await page.getByRole("button", { name: "Collapse sidebar" }).click();
      const sidebar = page.locator("aside");
      await expect(sidebar).toHaveScreenshot(`sidebar-collapsed-${theme}.png`);
    });
  });
}
