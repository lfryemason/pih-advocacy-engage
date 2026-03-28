import { test, expect, Page } from "@playwright/test";

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
  test.describe(`login page (${theme})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/auth/login");
      await page.waitForLoadState("networkidle");
      await setTheme(page, theme);
    });

    test("matches screenshot", async ({ page }) => {
      await expect(page).toHaveScreenshot(`login-${theme}.png`);
    });
  });

  test.describe(`sign up page (${theme})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/auth/sign-up");
      await page.waitForLoadState("networkidle");
      await setTheme(page, theme);
    });

    test("matches screenshot", async ({ page }) => {
      await expect(page).toHaveScreenshot(`sign-up-${theme}.png`);
    });
  });

  test.describe(`forgot password page (${theme})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/auth/forgot-password");
      await page.waitForLoadState("networkidle");
      await setTheme(page, theme);
    });

    test("matches screenshot", async ({ page }) => {
      await expect(page).toHaveScreenshot(`forgot-password-${theme}.png`);
    });
  });
}
