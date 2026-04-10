import { test, expect } from "@playwright/test";

const themes = ["light", "dark"] as const;

for (const theme of themes) {
  test.describe(`login page (${theme})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((t) => {
        window.localStorage.setItem("theme", t);
      }, theme);
      await page.goto("/auth/login");
      await page.waitForFunction(
        (t) => document.documentElement.classList.contains(t),
        theme,
      );
    });

    test("matches screenshot", async ({ page }) => {
      await expect(page).toHaveScreenshot(`login-${theme}.png`);
    });
  });

  test.describe(`sign up page (${theme})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((t) => {
        window.localStorage.setItem("theme", t);
      }, theme);
      await page.goto("/auth/sign-up");
      await page.waitForFunction(
        (t) => document.documentElement.classList.contains(t),
        theme,
      );
    });

    test("matches screenshot", async ({ page }) => {
      await expect(page).toHaveScreenshot(`sign-up-${theme}.png`);
    });
  });

  test.describe(`forgot password page (${theme})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((t) => {
        window.localStorage.setItem("theme", t);
      }, theme);
      await page.goto("/auth/forgot-password");
      await page.waitForFunction(
        (t) => document.documentElement.classList.contains(t),
        theme,
      );
    });

    test("matches screenshot", async ({ page }) => {
      await expect(page).toHaveScreenshot(`forgot-password-${theme}.png`);
    });
  });
}
