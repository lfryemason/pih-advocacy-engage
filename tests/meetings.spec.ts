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

    // Open the representative combobox and select the first option once loaded.
    await page.locator("#meeting-representative").click();
    await page
      .locator("#meeting-representative-listbox [role='option']")
      .first()
      .waitFor();
    await page
      .locator("#meeting-representative-listbox [role='option']")
      .first()
      .click();

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
    await page.locator("#meeting-representative").click();
    await page
      .locator("#meeting-representative-listbox [role='option']")
      .first()
      .waitFor();
    await page
      .locator("#meeting-representative-listbox [role='option']")
      .first()
      .click();

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

test.describe("edit meeting", () => {
  test("expand row shows read-only detail panel (not edit form)", async ({
    page,
  }) => {
    await page.goto("/meetings");

    const expandBtn = page
      .getByRole("button", { name: /Expand meeting with/ })
      .first();
    await expandBtn.click();
    await expect(expandBtn).toHaveAttribute("aria-expanded", "true");

    await expect(
      page.getByRole("button", { name: /Edit Meeting/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Save changes" }),
    ).not.toBeVisible();
  });

  test("clicking Edit Meeting shows the edit form", async ({ page }) => {
    await page.goto("/meetings");

    const expandBtn = page
      .getByRole("button", { name: /Expand meeting with/ })
      .first();
    await expandBtn.click();
    await page.getByRole("button", { name: /Edit Meeting/i }).click();

    await expect(
      page.getByRole("button", { name: "Save changes" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
  });

  test("cancel from edit returns to read-only panel (row stays expanded)", async ({
    page,
  }) => {
    await page.goto("/meetings");

    const expandBtn = page
      .getByRole("button", { name: /Expand meeting with/ })
      .first();
    await expandBtn.click();
    await page.getByRole("button", { name: /Edit Meeting/i }).click();

    // Wait for edit form to load, mutate a field.
    await expect(
      page.getByRole("button", { name: "Save changes" }),
    ).toBeVisible();
    await page
      .getByLabel(/^Date$/)
      .last()
      .fill("2055-01-01");

    // Cancel — should return to read-only panel, row stays expanded.
    await page.getByRole("button", { name: "Cancel" }).click();

    await expect(expandBtn).toHaveAttribute("aria-expanded", "true");
    await expect(
      page.getByRole("button", { name: /Edit Meeting/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Save changes" }),
    ).not.toBeVisible();
  });

  test("edit date to future moves meeting to Upcoming section", async ({
    page,
  }) => {
    await page.goto("/meetings");

    // Expand a past meeting row and enter edit mode
    const pastSection = page.getByLabel("Past Meetings");
    const pastExpandBtn = pastSection
      .getByRole("button", { name: /Expand meeting with/ })
      .first();
    await pastExpandBtn.click();
    await page.getByRole("button", { name: /Edit Meeting/i }).click();

    // Wait for edit form to load
    await expect(
      page.getByRole("button", { name: "Save changes" }),
    ).toBeVisible();

    // Change date to a future date
    await page
      .getByLabel(/^Date$/)
      .last()
      .fill("2099-07-04");

    // Save
    await page.getByRole("button", { name: "Save changes" }).click();

    // Panel returns to read-only and list refreshes
    await expect(
      page.getByRole("button", { name: "Save changes" }),
    ).not.toBeVisible();

    // Meeting should now appear in Upcoming
    await expect(
      page.getByLabel("Upcoming Meetings").getByText("Jul 4, 2099"),
    ).toBeVisible();
  });

  test("edit date to past moves meeting to Past section", async ({ page }) => {
    await page.goto("/meetings");

    // Expand an upcoming meeting row and enter edit mode
    const upcomingSection = page.getByLabel("Upcoming Meetings");
    const upcomingExpandBtn = upcomingSection
      .getByRole("button", { name: /Expand meeting with/ })
      .first();
    await upcomingExpandBtn.click();
    await page.getByRole("button", { name: /Edit Meeting/i }).click();

    await expect(
      page.getByRole("button", { name: "Save changes" }),
    ).toBeVisible();

    await page
      .getByLabel(/^Date$/)
      .last()
      .fill("2020-01-15");

    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(
      page.getByRole("button", { name: "Save changes" }),
    ).not.toBeVisible();

    await expect(
      page.getByLabel("Past Meetings").getByText("Jan 15, 2020"),
    ).toBeVisible();
  });
});
