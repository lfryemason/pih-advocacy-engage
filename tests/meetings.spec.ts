import { test, expect, type Page } from "@playwright/test";
import { AUTH_STATE_PATH } from "./global-setup";
import { resetDatabase } from "./reset-db";

async function expandAllMeetings(page: Page) {
  await page.getByRole("tab", { name: "All Meetings" }).click();
}

// The seed test user is a delegate on every seeded meeting, so seeded rows
// legitimately appear under both "My Meetings" and "All Meetings" once the
// latter is selected. Scope to "All Meetings" to keep locators unambiguous.
function allMeetingsRegion(page: Page) {
  return page.getByRole("tabpanel", { name: "All Meetings" });
}

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
    await expandAllMeetings(page);
    await expect(
      allMeetingsRegion(page)
        .getByLabel("Upcoming Meetings")
        .getByText("Adam Smith"),
    ).toBeVisible();
  });

  test("shows seed past meeting in the Past section", async ({ page }) => {
    await page.goto("/meetings");
    await expandAllMeetings(page);
    // Multiple sections contain Adam Smith; verify at least one row is in the past table
    await expect(page.getByText("Jan 15, 2020").first()).toBeVisible();
  });

  test("filter by state WA shows meetings for WA representative", async ({
    page,
  }) => {
    await page.goto("/meetings");
    await expandAllMeetings(page);
    await page.getByRole("button", { name: "Filter by state" }).click();
    await page.getByRole("menuitemcheckbox", { name: "Washington" }).click();
    await expect(page.getByText("Adam Smith").first()).toBeVisible();
  });

  test("filter by state OR shows empty state in both sections", async ({
    page,
  }) => {
    await page.goto("/meetings");
    await expandAllMeetings(page);
    await page.getByRole("button", { name: "Filter by state" }).click();
    await page.getByRole("menuitemcheckbox", { name: "Oregon" }).click();
    // The dropdown stays open after checking an item; close it so the rest
    // of the page (hidden via aria-hidden while it's open) is queryable again.
    await page.keyboard.press("Escape");
    // Scope to the "All Meetings" tab panel — other tabs (e.g. "My Meetings")
    // independently render their own empty states for the same filter.
    const emptyMessages =
      allMeetingsRegion(page).getByText("No meetings found.");
    await expect(emptyMessages).toHaveCount(2, { timeout: 15000 });
  });

  test("Clear all button resets filters and shows meetings again", async ({
    page,
  }) => {
    await page.goto("/meetings");
    await expandAllMeetings(page);
    await page.getByRole("button", { name: "Filter by state" }).click();
    await page.getByRole("menuitemcheckbox", { name: "Oregon" }).click();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: /Clear all/i }).click();
    await expect(page.getByText("Adam Smith").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Clear all/i })).toHaveCount(
      0,
    );
  });

  test("shows a loading skeleton while a filter is being applied", async ({
    page,
  }) => {
    await page.goto("/meetings");
    await expandAllMeetings(page);
    // Wait for the initial list so we isolate the filter-triggered refetch.
    await expect(page.getByText("Adam Smith").first()).toBeVisible();

    // Delay the refetch so the transient skeleton is observable.
    await page.route(/\/rest\/v1\/meetings/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.continue();
    });

    await page.getByRole("button", { name: "Filter by state" }).click();
    await page.getByRole("menuitemcheckbox", { name: "Washington" }).click();
    // Close the (modal) dropdown so the page behind it is no longer aria-hidden.
    await page.keyboard.press("Escape");

    const status = page.getByRole("status", { name: "Updating meetings" });
    await expect(status).toBeVisible();

    // Once the refetch resolves, the skeleton gives way to the results.
    await expect(status).toBeHidden();
    await expect(page.getByText("Adam Smith").first()).toBeVisible();
  });

  test("expand button toggles chevron aria-expanded", async ({ page }) => {
    await page.goto("/meetings");
    await expandAllMeetings(page);
    const expandBtn = allMeetingsRegion(page)
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
    await expandAllMeetings(page);

    // Open dialog
    await page.getByRole("button", { name: /Add Meeting/i }).click();
    await expect(
      page.getByRole("dialog", { name: "Add Meeting" }),
    ).toBeVisible();

    // Fill required fields
    await page.getByLabel(/^Date$/).fill("2099-12-25");

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
      allMeetingsRegion(page)
        .getByLabel("Upcoming Meetings")
        .getByText("Dec 25, 2099"),
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
    await page.getByLabel(/^Date$/).fill("2099-12-25");
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
    await expandAllMeetings(page);

    await page.getByRole("button", { name: /Add Meeting/i }).click();
    await page.getByLabel(/^Date$/).fill("2099-11-01");
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
      allMeetingsRegion(page)
        .getByLabel("Upcoming Meetings")
        .getByText("Nov 1, 2099"),
    ).toBeVisible();
  });
});

test.describe("edit meeting", () => {
  test("expand row shows read-only detail panel (not edit form)", async ({
    page,
  }) => {
    await page.goto("/meetings");
    await expandAllMeetings(page);

    const expandBtn = allMeetingsRegion(page)
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
    await expandAllMeetings(page);

    const expandBtn = allMeetingsRegion(page)
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
    await expandAllMeetings(page);

    const expandBtn = allMeetingsRegion(page)
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
    await expandAllMeetings(page);

    // Expand a past meeting row and enter edit mode
    const pastSection = allMeetingsRegion(page).getByLabel("Past Meetings");
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
      allMeetingsRegion(page)
        .getByLabel("Upcoming Meetings")
        .getByText("Jul 4, 2099"),
    ).toBeVisible();
  });

  test("edit date to past moves meeting to Past section", async ({ page }) => {
    await page.goto("/meetings");
    await expandAllMeetings(page);

    // Expand an upcoming meeting row and enter edit mode
    const upcomingSection =
      allMeetingsRegion(page).getByLabel("Upcoming Meetings");
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
      allMeetingsRegion(page)
        .getByLabel("Past Meetings")
        .getByText("Jan 15, 2020"),
    ).toBeVisible();
  });

  test("delete removes the meeting from the list", async ({ page }) => {
    await page.goto("/meetings");
    await expandAllMeetings(page);

    // Create a meeting with a distinctive date so the assertions can't collide
    // with seed data, then delete it. The creator is seeded as the meeting's
    // scheduling lead, so the test user is allowed to delete it.
    await page.getByRole("button", { name: /Add Meeting/i }).click();
    await page.getByLabel(/^Date$/).fill("2099-08-15");
    await page.locator("#meeting-representative").click();
    await page
      .locator("#meeting-representative-listbox [role='option']")
      .first()
      .waitFor();
    await page
      .locator("#meeting-representative-listbox [role='option']")
      .first()
      .click();
    await page.getByRole("button", { name: "Add meeting" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();

    const upcoming = allMeetingsRegion(page).getByLabel("Upcoming Meetings");
    await expect(upcoming.getByText("Aug 15, 2099")).toBeVisible();

    // Expand the row, enter edit mode, and delete it.
    const row = upcoming.getByRole("row").filter({ hasText: "Aug 15, 2099" });
    await row.getByRole("button", { name: /Expand meeting with/ }).click();
    await page.getByRole("button", { name: /Edit Meeting/i }).click();
    await expect(
      page.getByRole("button", { name: "Save changes" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Delete meeting" })
      .click();

    await expect(upcoming.getByText("Aug 15, 2099")).toHaveCount(0);
  });
});

test.describe("US4 — Delegation members", () => {
  async function addMemberViaForm(page: Page, name: string) {
    await page.getByRole("button", { name: /add member/i }).click();
    const searchInputs = page.getByPlaceholder("Search by name…");
    await searchInputs.last().fill(name.split(" ")[0]);
    const result = page.getByText(name);
    await expect(result).toBeVisible();
    await result.click();
  }

  test("add two members from different teams → both teams appear in represented-teams list after saving", async ({
    page,
  }) => {
    await page.goto("/meetings");
    await expandAllMeetings(page);

    const expandBtn = allMeetingsRegion(page)
      .getByRole("button", { name: /Expand meeting with/ })
      .first();
    await expandBtn.click();
    await page.getByRole("button", { name: /Edit Meeting/i }).click();
    await expect(
      page.getByRole("button", { name: "Save changes" }),
    ).toBeVisible();

    await addMemberViaForm(page, "Alice Smith");
    await addMemberViaForm(page, "Bob Jones");

    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(
      page.getByRole("button", { name: /Edit Meeting/i }),
    ).toBeVisible();

    const representedList = page.getByRole("list", {
      name: /represented teams/i,
    });
    await expect(representedList).toBeVisible();
    const teamCount = await representedList.getByRole("listitem").count();
    expect(teamCount).toBeGreaterThanOrEqual(1);
  });

  test("remove a member → their team disappears from represented-teams after saving", async ({
    page,
  }) => {
    await page.goto("/meetings");
    await expandAllMeetings(page);

    const expandBtn = allMeetingsRegion(page)
      .getByRole("button", { name: /Expand meeting with/ })
      .first();
    await expandBtn.click();
    await page.getByRole("button", { name: /Edit Meeting/i }).click();
    await expect(
      page.getByRole("button", { name: "Save changes" }),
    ).toBeVisible();

    await addMemberViaForm(page, "Carol Solo");

    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(
      page.getByRole("button", { name: /Edit Meeting/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("list", { name: /represented teams/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: /Edit Meeting/i }).click();
    await page.getByRole("button", { name: /remove carol solo/i }).click();
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(
      page.getByRole("button", { name: /Edit Meeting/i }),
    ).toBeVisible();

    await expect(
      page.getByRole("list", { name: /represented teams/i }),
    ).toBeHidden();
  });

  test("placeholder teammate appears in member search and can be added", async ({
    page,
  }) => {
    await page.goto("/meetings");
    await expandAllMeetings(page);

    const expandBtn = allMeetingsRegion(page)
      .getByRole("button", { name: /Expand meeting with/ })
      .first();
    await expandBtn.click();
    await page.getByRole("button", { name: /Edit Meeting/i }).click();
    await expect(
      page.getByRole("button", { name: "Save changes" }),
    ).toBeVisible();

    await page.getByRole("button", { name: /add member/i }).click();
    const searchInput = page.getByPlaceholder("Search by name…").last();
    await searchInput.fill("Penny");
    const pennyResult = page.getByText("Penny Placeholder");
    await expect(pennyResult).toBeVisible();
    await pennyResult.click();

    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(
      page.getByRole("button", { name: "Save changes" }),
    ).not.toBeVisible();
  });
});
