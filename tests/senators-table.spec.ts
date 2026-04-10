import { test, expect } from "@playwright/test";
import { AUTH_STATE_PATH } from "./global-setup";

test.use({ storageState: AUTH_STATE_PATH });

test.describe("senators table (e2e)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/representatives");
    await page.waitForLoadState("networkidle");
  });

  test("renders table with senators", async ({ page }) => {
    await expect(page.getByRole("table")).toBeVisible({ timeout: 15000 });
    expect(await page.getByRole("row").count()).toBeGreaterThan(1);
    const firstDataRow = page.getByRole("row").nth(1);
    await firstDataRow.click();
    await page.waitForURL(/\/representatives\/.+/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
