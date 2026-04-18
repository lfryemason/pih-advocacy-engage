import { test, expect, Page } from "@playwright/test";
import { AUTH_STATE_PATH } from "../global-setup";

test.use({
  storageState: AUTH_STATE_PATH,
  viewport: { width: 400, height: 800 },
});

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
  test.describe(`mobile header (${theme})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/representatives");
      await page.waitForLoadState("networkidle");
      await setTheme(page, theme);
    });

    test("matches screenshot", async ({ page }) => {
      const header = page.getByRole("banner");
      await expect(header).toBeVisible();
      await expect(header).toHaveScreenshot(`mobile-header-${theme}.png`);
    });

    test("matches screenshot with dropdown open", async ({ page }) => {
      await page.getByRole("banner").click();
      await expect(page.getByRole("menu")).toBeVisible();
      await expect(page).toHaveScreenshot(`mobile-header-open-${theme}.png`);
    });
  });
}
