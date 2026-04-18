import { test, expect } from "@playwright/test";
import { AUTH_STATE_PATH } from "./global-setup";

test.use({ storageState: AUTH_STATE_PATH });

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
});

test.describe("sidebar", () => {
  test("renders logo", async ({ page }) => {
    const sidebar = page.locator("aside");
    await expect(
      sidebar.getByRole("img", { name: "PIH Advocacy Engage" }),
    ).toBeVisible();
  });

  test("renders links", async ({ page }) => {
    const sidebar = page.locator("aside");
    await expect(sidebar.getByRole("link", { name: "Meetings" })).toBeVisible();
    await expect(
      sidebar.getByRole("link", { name: "Representatives" }),
    ).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Teams" })).toBeVisible();
    // href-based selector used because the link label is dynamic (shows user's full name when set)
    await expect(sidebar.locator('a[href="/profile"]')).toBeVisible();
  });

  test("hides logo when collapsed", async ({ page }) => {
    await page.getByRole("button", { name: "Collapse sidebar" }).click();
    const sidebar = page.locator("aside");
    await expect(
      sidebar.getByRole("img", { name: "PIH Advocacy Engage" }),
    ).not.toBeVisible();
  });

  test("theme dropdown opens and lists all options", async ({ page }) => {
    await page.getByRole("button", { name: "Select theme" }).click();
    await expect(page.getByRole("menuitem", { name: /light/i })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /dark/i })).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: /high contrast/i }),
    ).toBeVisible();
  });

  test("theme dropdown applies selected theme", async ({ page }) => {
    await page.getByRole("button", { name: "Select theme" }).click();
    await page.getByRole("menuitem", { name: /dark/i }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);

    await page.getByRole("button", { name: "Select theme" }).click();
    await page.getByRole("menuitem", { name: /high contrast/i }).click();
    await expect(page.locator("html")).toHaveClass(/high-contrast/);

    await page.getByRole("button", { name: "Select theme" }).click();
    await page.getByRole("menuitem", { name: /light/i }).click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
    await expect(page.locator("html")).not.toHaveClass(/high-contrast/);
  });

  test("shows nav icons when collapsed", async ({ page }) => {
    await page.getByRole("button", { name: "Collapse sidebar" }).click();
    const sidebar = page.locator("aside");
    await expect(sidebar.getByRole("link", { name: "Meetings" })).toBeVisible();
    await expect(
      sidebar.getByRole("link", { name: "Representatives" }),
    ).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Teams" })).toBeVisible();
  });
});
