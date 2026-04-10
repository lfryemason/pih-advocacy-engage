import { test, expect } from "@playwright/test";
import { AUTH_STATE_PATH } from "./global-setup";

test.use({ storageState: AUTH_STATE_PATH });

test.describe("senators table (e2e)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/representatives");
  });

  test("renders table with senators", async ({ page }) => {
    await expect(page.getByRole("table")).toBeVisible({ timeout: 15000 });
    expect(await page.getByRole("row").count()).toBeGreaterThan(1);
  });

  test("clicking a row navigates to detail page", async ({ page }) => {
    await expect(page.getByRole("table")).toBeVisible({ timeout: 15000 });
    const firstDataRow = page.getByRole("row").nth(1);
    await firstDataRow.click();
    await page.waitForURL(/\/representatives\/.+/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
