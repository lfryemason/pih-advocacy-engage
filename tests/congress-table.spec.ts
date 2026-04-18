import { test, expect } from "@playwright/test";
import { AUTH_STATE_PATH } from "./global-setup";

test.use({ storageState: AUTH_STATE_PATH });

test.describe("congress table (e2e)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/representatives");
  });

  test("renders table with representatives", async ({ page }) => {
    const table = page.getByRole("table", { name: "Representatives" });
    await expect(table).toBeVisible();
    await expect(table.getByText("April May")).toBeVisible();
    await expect(table.getByText("Peter Petrawicki")).toBeVisible();
    await expect(table.getByText("Andy Skampt")).toBeVisible();
    await expect(table.getByText("Miranda Beckwith")).toBeVisible();
  });

  test("shows State, District and Party columns", async ({ page }) => {
    const table = page.getByRole("table", { name: "Representatives" });
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
    const table = page.getByRole("table", { name: "Representatives" });
    await expect(table).toBeVisible();
    await table.getByRole("link", { name: "April May" }).click();
    await page.waitForURL("/representatives/R000001");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("party filter shows only representatives in that party", async ({
    page,
  }) => {
    const table = page.getByRole("table", { name: "Representatives" });
    await expect(
      table.getByRole("link", { name: "Peter Petrawicki" }),
    ).toBeVisible();
    await expect(table.getByRole("link", { name: "April May" })).toBeVisible();
    await expect(
      table.getByRole("link", { name: "Andy Skampt" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Filter by party" }).click();
    await page.getByRole("menuitem", { name: "Republican" }).click();
    await page.keyboard.press("Escape");

    await expect(
      table.getByRole("link", { name: "Peter Petrawicki" }),
    ).toBeVisible();
    await expect(table.getByRole("link", { name: "April May" })).toBeHidden();
    await expect(table.getByRole("link", { name: "Andy Skampt" })).toBeHidden();
  });

  test("name filter shows only representatives whose name matches", async ({
    page,
  }) => {
    const table = page.getByRole("table", { name: "Representatives" });
    await expect(table.getByRole("link", { name: "April May" })).toBeVisible();
    await expect(
      table.getByRole("link", { name: "Peter Petrawicki" }),
    ).toBeVisible();

    await page.getByRole("textbox", { name: "Filter by name" }).fill("April");

    await expect(table.getByRole("link", { name: "April May" })).toBeVisible();
    await expect(
      table.getByRole("link", { name: "Peter Petrawicki" }),
    ).toBeHidden();
    await expect(table.getByRole("link", { name: "Andy Skampt" })).toBeHidden();
  });
});
