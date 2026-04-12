import { test, expect } from "@playwright/test";
import { AUTH_STATE_PATH } from "./global-setup";

test.use({ storageState: AUTH_STATE_PATH });

test.describe("senators table (e2e)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/representatives");
  });

  test("renders table with senators", async ({ page }) => {
    await expect(page.getByRole("table", { name: "Senators" })).toBeVisible();
    expect(await page.getByRole("row").count()).toBeGreaterThan(1);
  });

  test("clicking a senator name navigates to detail page", async ({ page }) => {
    const table = page.getByRole("table", { name: "Senators" });
    await expect(table).toBeVisible();
    const firstLink = table.getByRole("link").first();
    await expect(firstLink).toBeVisible();
    await firstLink.click();
    await page.waitForURL(/\/representatives\/.+/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
