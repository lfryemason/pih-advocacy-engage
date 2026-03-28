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
    await expect(sidebar.getByRole("link", { name: /profile/i })).toBeVisible();
  });

  test("hides logo when collapsed", async ({ page }) => {
    await page.getByRole("button", { name: "Collapse sidebar" }).click();
    const sidebar = page.locator("aside");
    await expect(
      sidebar.getByRole("img", { name: "PIH Advocacy Engage" }),
    ).not.toBeVisible();
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
