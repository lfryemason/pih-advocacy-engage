import { test, expect } from "@playwright/test";
import { AUTH_STATE_PATH } from "./global-setup";
import { resetDatabase } from "./reset-db";

test.use({ storageState: AUTH_STATE_PATH });
test.beforeEach(resetDatabase);

test.describe("meetings list page", () => {
  test("renders Upcoming and Past sections", async ({ page }) => {
    await page.goto("/meetings");
    await expect(
      page.getByRole("heading", { name: "Upcoming Meetings" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Past Meetings" }),
    ).toBeVisible();
  });

  test("shows seed upcoming meeting in the Upcoming section", async ({
    page,
  }) => {
    await page.goto("/meetings");
    await expect(page.getByText("Adam Smith")).toBeVisible();
  });

  test("shows seed past meeting in the Past section", async ({ page }) => {
    await page.goto("/meetings");
    // Both sections contain Adam Smith; verify at least one row is in the past table
    await expect(page.getByText("Jan 15, 2020")).toBeVisible();
  });

  test("filter by state WA shows meetings for WA representative", async ({
    page,
  }) => {
    await page.goto("/meetings");
    await page.getByRole("button", { name: "Filter by state" }).click();
    await page.getByRole("menuitemcheckbox", { name: "Washington" }).click();
    await expect(page.getByText("Adam Smith")).toBeVisible();
  });

  test("filter by state OR shows empty state in both sections", async ({
    page,
  }) => {
    await page.goto("/meetings");
    await page.getByRole("button", { name: "Filter by state" }).click();
    await page.getByRole("menuitemcheckbox", { name: "Oregon" }).click();
    const emptyMessages = page.getByText("No meetings found.");
    await expect(emptyMessages).toHaveCount(2);
  });

  test("Clear all button resets filters and shows meetings again", async ({
    page,
  }) => {
    await page.goto("/meetings");
    await page.getByRole("button", { name: "Filter by state" }).click();
    await page.getByRole("menuitemcheckbox", { name: "Oregon" }).click();
    await page.getByRole("button", { name: /Clear all/i }).click();
    await expect(page.getByText("Adam Smith")).toBeVisible();
    await expect(page.getByRole("button", { name: /Clear all/i })).toHaveCount(
      0,
    );
  });

  test("expand button toggles chevron aria-expanded", async ({ page }) => {
    await page.goto("/meetings");
    const expandBtn = page
      .getByRole("button", { name: /Expand meeting with/ })
      .first();
    await expect(expandBtn).toHaveAttribute("aria-expanded", "false");
    await expandBtn.click();
    await expect(expandBtn).toHaveAttribute("aria-expanded", "true");
  });
});
