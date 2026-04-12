import { test, expect } from "@playwright/test";
import { AUTH_STATE_PATH } from "./global-setup";

test.use({ storageState: AUTH_STATE_PATH });

test.describe("congress table (e2e)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/representatives");
  });

  test("renders table with representatives", async ({ page }) => {
    const table = page.getByRole("table").nth(1);
    await expect(table).toBeVisible();
    await expect(table.getByText("April May")).toBeVisible();
    await expect(table.getByText("Peter Petrawicki")).toBeVisible();
    await expect(table.getByText("Andy Skampt")).toBeVisible();
    await expect(table.getByText("Miranda Beckwith")).toBeVisible();
  });

  test("shows State, District and Party columns", async ({ page }) => {
    const table = page.getByRole("table").nth(1);
    await expect(
      table.getByRole("columnheader", { name: "State" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "District" }),
    ).toBeVisible();
    await expect(
      table.getByRole("columnheader", { name: "Party" }),
    ).toBeVisible();
  });

  test("clicking a representative name navigates to detail page", async ({
    page,
  }) => {
    const table = page.getByRole("table").nth(1);
    await expect(table).toBeVisible();
    await table.getByRole("link", { name: "April May" }).click();
    await page.waitForURL("/representatives/R000001");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
