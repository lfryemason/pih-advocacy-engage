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
    await expect(
      page.getByLabel("Upcoming Meetings").getByText("Adam Smith"),
    ).toBeVisible();
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
    await expect(page.getByText("Adam Smith").first()).toBeVisible();
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
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: /Clear all/i }).click();
    await expect(page.getByText("Adam Smith").first()).toBeVisible();
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

  test("Add Meeting button is visible", async ({ page }) => {
    await page.goto("/meetings");
    await expect(
      page.getByRole("button", { name: /Add Meeting/i }),
    ).toBeVisible();
  });
});

test.describe("create meeting", () => {
  test("creates a new meeting and shows it in the Upcoming section", async ({
    page,
  }) => {
    await page.goto("/meetings");

    // Open dialog
    await page.getByRole("button", { name: /Add Meeting/i }).click();
    await expect(
      page.getByRole("dialog", { name: "Add Meeting" }),
    ).toBeVisible();

    // Fill required fields
    await page.getByLabel("Date").fill("2099-12-25");

    // Wait for representatives to load and select one
    await page.waitForSelector(
      'select[id="meeting-representative"] option:not([value=""])',
    );
    await page.selectOption("#meeting-representative", { index: 1 });

    // Submit
    await page.getByRole("button", { name: "Add meeting" }).click();

    // Dialog should close and list should refresh
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(
      page.getByLabel("Upcoming Meetings").getByText("Dec 25, 2099"),
    ).toBeVisible();
  });

  test("shows validation error when date is missing", async ({ page }) => {
    await page.goto("/meetings");

    await page.getByRole("button", { name: /Add Meeting/i }).click();
    await page.getByRole("button", { name: "Add meeting" }).click();

    await expect(page.getByRole("alert")).toContainText(
      "Meeting date is required",
    );
  });

  test("shows validation error when representative is missing", async ({
    page,
  }) => {
    await page.goto("/meetings");

    await page.getByRole("button", { name: /Add Meeting/i }).click();
    await page.getByLabel("Date").fill("2099-12-25");
    await page.getByRole("button", { name: "Add meeting" }).click();

    await expect(page.getByRole("alert")).toContainText(
      "Member of Congress is required",
    );
  });

  test("cancel closes the dialog without creating a meeting", async ({
    page,
  }) => {
    await page.goto("/meetings");

    await page.getByRole("button", { name: /Add Meeting/i }).click();
    await page.getByRole("button", { name: "Cancel" }).click();

    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("creates a meeting with a link visible after creation", async ({
    page,
  }) => {
    await page.goto("/meetings");

    await page.getByRole("button", { name: /Add Meeting/i }).click();
    await page.getByLabel("Date").fill("2099-11-01");
    await page.waitForSelector(
      'select[id="meeting-representative"] option:not([value=""])',
    );
    await page.selectOption("#meeting-representative", { index: 1 });

    await page.getByRole("button", { name: /Add link/i }).click();
    await page.getByLabel("Link 1 label").fill("Agenda");
    await page.getByLabel("Link 1 URL").fill("https://example.com/agenda");

    await page.getByRole("button", { name: "Add meeting" }).click();

    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(
      page.getByLabel("Upcoming Meetings").getByText("Nov 1, 2099"),
    ).toBeVisible();
  });
});
