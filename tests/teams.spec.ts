import { test, expect } from "@playwright/test";
import { AUTH_STATE_PATH } from "./global-setup";
import { resetDatabase } from "./reset-db";

test.use({ storageState: AUTH_STATE_PATH });
test.beforeEach(resetDatabase);

test.describe("teams list page", () => {
  test("shows seed teams in the table", async ({ page }) => {
    await page.goto("/teams");
    await expect(
      page.getByRole("cell", { name: "Seattle High School" }),
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Portland University" }),
    ).toBeVisible();
  });

  test("clicking a team row navigates to the detail page", async ({ page }) => {
    await page.goto("/teams");
    await page.getByRole("cell", { name: "Seattle High School" }).click();
    await expect(page).toHaveURL(/\/teams\/seattle-high-school$/);
  });

  test("has a Create team button linking to /teams/new", async ({ page }) => {
    await page.goto("/teams");
    await expect(
      page.getByRole("link", { name: "Create team" }),
    ).toHaveAttribute("href", "/teams/new");
  });
});

test.describe("team detail page", () => {
  test("shows team name and metadata", async ({ page }) => {
    await page.goto("/teams/seattle-high-school");
    await expect(
      page.getByRole("heading", { name: "Seattle High School" }),
    ).toBeVisible();
    await expect(page.getByText(/Washington/)).toBeVisible();
    await expect(page.getByText(/High School team/)).toBeVisible();
  });

  test("shows the test user as a lead", async ({ page }) => {
    await page.goto("/teams/seattle-high-school");
    // Test Admin is the seeded team_lead — scope to the lead list so the
    // sidebar nav link (which also shows the user's name) doesn't cause a
    // strict-mode violation.
    await expect(
      page.getByRole("listitem").getByText("Test Admin"),
    ).toBeVisible();
  });

  test("member sees Edit button and not Join team", async ({ page }) => {
    await page.goto("/teams/seattle-high-school");
    await expect(page.getByRole("link", { name: "Edit" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Join team" })).toHaveCount(
      0,
    );
  });

  test("non-member sees Join team button and not Edit", async ({ page }) => {
    await page.goto("/teams/portland-university");
    await expect(page.getByRole("button", { name: "Join team" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Edit" })).toHaveCount(0);
  });

  test("joining a team hides the Join team button", async ({ page }) => {
    await page.goto("/teams/portland-university");
    await page.getByRole("button", { name: "Join team" }).click();
    await expect(page.getByRole("button", { name: "Join team" })).toHaveCount(
      0,
    );
    await expect(page.getByRole("link", { name: "Edit" })).toBeVisible();
  });

  test("back link returns to teams list", async ({ page }) => {
    await page.goto("/teams/seattle-high-school");
    await page.getByRole("link", { name: /← Teams/ }).click();
    await expect(page).toHaveURL(/\/teams$/);
  });

  test("unknown slug redirects to teams list", async ({ page }) => {
    await page.goto("/teams/does-not-exist");
    await expect(page).toHaveURL(/\/teams$/);
  });
});

test.describe("create team page", () => {
  test("renders the creation form", async ({ page }) => {
    await page.goto("/teams/new");
    await expect(
      page.getByRole("heading", { name: "Create a new team" }),
    ).toBeVisible();
    await expect(page.getByLabel(/Name/)).toBeVisible();
    await expect(page.getByLabel(/State/)).toBeVisible();
    await expect(page.getByLabel(/Type/)).toBeVisible();
  });

  test("creating a team navigates to the new team page", async ({ page }) => {
    await page.goto("/teams/new");
    await page.getByLabel(/Name/).fill("Test City Team");
    await page.getByLabel(/State/).selectOption("CA");
    await page.getByLabel(/Type/).selectOption("city");
    await page.getByRole("button", { name: "Create team" }).click();
    await expect(page).toHaveURL(/\/teams\/test-city-team$/);
  });
});

test.describe("edit team page", () => {
  test("Edit button navigates to the edit page", async ({ page }) => {
    await page.goto("/teams/seattle-high-school");
    await page.getByRole("link", { name: "Edit" }).click();
    await expect(page).toHaveURL(/\/teams\/seattle-high-school\/edit$/);
  });

  test("edit page shows the team form pre-populated", async ({ page }) => {
    await page.goto("/teams/seattle-high-school/edit");
    await expect(page.getByLabel(/Name/)).toHaveValue("Seattle High School");
    await expect(page.getByLabel(/State/)).toHaveValue("Washington");
    await expect(page.getByLabel(/Type/)).toHaveValue("high_school");
  });

  test("edit page shows the members section", async ({ page }) => {
    await page.goto("/teams/seattle-high-school/edit");
    await expect(page.getByRole("heading", { name: "Members" })).toBeVisible();
    // Scope to table cells so the sidebar nav (which also contains "Test Admin")
    // doesn't cause a strict-mode violation.
    await expect(
      page.getByRole("cell", { name: "Test", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Admin", exact: true }),
    ).toBeVisible();
  });

  test("saving a field change returns to the team detail page", async ({
    page,
  }) => {
    await page.goto("/teams/seattle-high-school/edit");
    await page.getByLabel(/Description/).fill("A great high school team.");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page).toHaveURL(/\/teams\/seattle-high-school$/);
    await expect(page.getByText("A great high school team.")).toBeVisible();
  });

  test("back link returns to team detail page", async ({ page }) => {
    await page.goto("/teams/seattle-high-school/edit");
    await page.getByRole("link", { name: /← Seattle High School/ }).click();
    await expect(page).toHaveURL(/\/teams\/seattle-high-school$/);
  });

  test("changing a member role persists after refresh", async ({ page }) => {
    await page.goto("/teams/seattle-high-school/edit");
    const roleSelect = page
      .getByRole("row", { name: /Test/ })
      .getByRole("combobox");
    await roleSelect.selectOption("member");
    await expect(roleSelect).toBeDisabled();
    await expect(roleSelect).toBeEnabled();
    await page.reload();
    await expect(roleSelect).toHaveValue("member");
  });

  test("removing a member removes them from the table", async ({ page }) => {
    // Join portland-university first so there's a second member to remove
    await page.goto("/teams/portland-university");
    await page.getByRole("button", { name: "Join team" }).click();
    await expect(page.getByRole("link", { name: "Edit" })).toBeVisible();

    await page.goto("/teams/portland-university/edit");
    await expect(page.getByRole("row", { name: /Test/ })).toBeVisible();

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: /^Remove/ }).click();

    await expect(page.getByRole("row", { name: /Test/ })).toHaveCount(0);
  });
});
