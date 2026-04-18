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

  test("state filter shows only senators from that state", async ({ page }) => {
    const table = page.getByRole("table", { name: "Senators" });
    await expect(table.getByRole("link", { name: "Hank Green" })).toBeVisible();
    await expect(table.getByRole("link", { name: "John Green" })).toBeVisible();

    await page.getByRole("button", { name: "Filter by state" }).click();
    await page.getByRole("menuitem", { name: "Montana" }).click();
    await page.keyboard.press("Escape");

    await expect(table.getByRole("link", { name: "Hank Green" })).toBeVisible();
    await expect(table.getByRole("link", { name: "John Green" })).toBeHidden();
  });

  test("name filter shows only senators whose name matches", async ({
    page,
  }) => {
    const table = page.getByRole("table", { name: "Senators" });
    await expect(table.getByRole("link", { name: "Hank Green" })).toBeVisible();
    await expect(table.getByRole("link", { name: "John Green" })).toBeVisible();

    await page.getByRole("textbox", { name: "Filter by name" }).fill("Hank");

    await expect(table.getByRole("link", { name: "Hank Green" })).toBeVisible();
    await expect(table.getByRole("link", { name: "John Green" })).toBeHidden();
  });
});
