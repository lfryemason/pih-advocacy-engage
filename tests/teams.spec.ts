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
    await expect(
      page.getByRole("cell", { name: "Haverford/Bryn Mawr College" }),
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
    await expect(page.getByText("High School", { exact: true })).toBeVisible();
  });

  test("shows the test user as Team Coordinator in the leadership table", async ({
    page,
  }) => {
    await page.goto("/teams/seattle-high-school");
    await expect(
      page.getByRole("cell", { name: "Team Coordinator" }),
    ).toBeVisible();
    // Name "Test Admin" should appear in the row
    await expect(page.getByRole("cell", { name: /Test Admin/ })).toBeVisible();
  });

  test("advocacy lead row shows correct member name", async ({ page }) => {
    await page.goto("/teams/seattle-high-school");
    await expect(
      page.getByRole("cell", { name: "Advocacy Lead" }),
    ).toBeVisible();
    await expect(page.getByRole("cell", { name: /Alex Rivera/ })).toBeVisible();
  });

  test("community building lead row shows correct member name", async ({
    page,
  }) => {
    await page.goto("/teams/seattle-high-school");
    await expect(
      page.getByRole("cell", { name: "Community Building Lead" }),
    ).toBeVisible();
    await expect(page.getByRole("cell", { name: /Jordan Kim/ })).toBeVisible();
  });

  test("general members section shows the seeded member", async ({ page }) => {
    await page.goto("/teams/seattle-high-school");
    await expect(page.getByRole("cell", { name: /Sam Patel/ })).toBeVisible();
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

  test("shows College/University label for university type team", async ({
    page,
  }) => {
    await page.goto("/teams/portland-university");
    await expect(
      page.getByText("College/University", { exact: true }),
    ).toBeVisible();
  });

  test("shows Representatives section open by default when team has districts", async ({
    page,
  }) => {
    await page.goto("/teams/seattle-high-school");
    await expect(
      page.getByRole("button", { name: /Members of Congress/ }),
    ).toBeVisible();
    await expect(
      page.locator('[aria-label="Senators"]').getByText("Susan Collins"),
    ).toBeVisible();
    await expect(
      page.locator('[aria-label="Representatives"]').getByText("Adam Smith"),
    ).toBeVisible();
  });

  test("collapsing Representatives toggle hides the rep list", async ({
    page,
  }) => {
    await page.goto("/teams/seattle-high-school");
    await page.getByRole("button", { name: /Members of Congress/ }).click();
    await expect(page.getByText("Susan Collins")).toHaveCount(0);
  });

  test("Representatives section is hidden when team has no districts", async ({
    page,
  }) => {
    await page.goto("/teams/portland-university");
    await expect(
      page.getByRole("button", { name: /Members of Congress/ }),
    ).toHaveCount(0);
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
    await page
      .getByRole("navigation", { name: "breadcrumb" })
      .getByRole("link", { name: "Teams" })
      .click();
    await expect(page).toHaveURL(/\/teams$/);
  });

  test("unknown slug redirects to teams list", async ({ page }) => {
    await page.goto("/teams/does-not-exist");
    await expect(page).toHaveURL(/\/teams$/);
  });

  test("HMC team page shows Pennsylvania and districts 4 and 5", async ({
    page,
  }) => {
    await page.goto("/teams/haverford-bryn-mawr-college");
    await expect(
      page.getByRole("heading", { name: "Haverford/Bryn Mawr College" }),
    ).toBeVisible();
    await expect(page.getByText(/Pennsylvania/)).toBeVisible();
    await expect(page.getByText(/District 4/)).toBeVisible();
    await expect(page.getByText(/District 5/)).toBeVisible();
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

  test("shows required field legend", async ({ page }) => {
    await page.goto("/teams/new");
    await expect(page.getByText("* Required")).toBeVisible();
  });

  test("creating a team navigates to the new team page", async ({ page }) => {
    await page.goto("/teams/new");
    await page.getByLabel(/Name/).fill("Test City Team");
    await page.getByLabel(/State/).selectOption("CA");
    await page.getByLabel(/Type/).selectOption("city");
    await page.getByRole("button", { name: "Create team" }).click();
    await expect(page).toHaveURL(/\/teams\/test-city-team$/);
  });

  test("Cancel returns to the teams list", async ({ page }) => {
    await page.goto("/teams/new");
    await page.getByRole("link", { name: "Cancel" }).click();
    await expect(page).toHaveURL(/\/teams$/);
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
    await expect(page.getByLabel(/State/)).toHaveValue("WA");
    await expect(page.getByLabel(/Type/)).toHaveValue("high_school");
  });

  test("edit page shows the members section", async ({ page }) => {
    await page.goto("/teams/seattle-high-school/edit");
    await expect(page.getByRole("heading", { name: "Members" })).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Test Admin", exact: true }),
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
    await page
      .getByRole("navigation", { name: "breadcrumb" })
      .getByRole("link", { name: "Seattle High School" })
      .click();
    await expect(page).toHaveURL(/\/teams\/seattle-high-school$/);
  });

  test("changing a member role is not saved until Save is clicked", async ({
    page,
  }) => {
    await page.goto("/teams/seattle-high-school/edit");
    const roleSelect = page
      .getByRole("row", { name: /Test/ })
      .getByRole("combobox");
    await roleSelect.selectOption("member");
    await expect(roleSelect).toHaveValue("member");

    // Reloading without saving discards the pending role change.
    await page.reload();
    await expect(
      page.getByRole("row", { name: /Test/ }).getByRole("combobox"),
    ).toHaveValue("team_coordinator");
  });

  test("changing a member role persists after clicking Save", async ({
    page,
  }) => {
    await page.goto("/teams/seattle-high-school/edit");
    await page
      .getByRole("row", { name: /Test/ })
      .getByRole("combobox")
      .selectOption("member");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page).toHaveURL(/\/teams\/seattle-high-school$/);

    await page.goto("/teams/seattle-high-school/edit");
    await expect(
      page.getByRole("row", { name: /Test/ }).getByRole("combobox"),
    ).toHaveValue("member");
  });

  test("role dropdown includes Team Coordinator and not Team Lead", async ({
    page,
  }) => {
    await page.goto("/teams/seattle-high-school/edit");
    const roleSelect = page
      .getByRole("row", { name: /Test/ })
      .getByRole("combobox");
    await expect(
      roleSelect.locator("option[value='team_coordinator']"),
    ).toHaveCount(1);
    await expect(roleSelect.locator("option[value='team_lead']")).toHaveCount(
      0,
    );
  });

  test("can assign community_building_lead role in edit page dropdown", async ({
    page,
  }) => {
    await page.goto("/teams/seattle-high-school/edit");
    const roleSelect = page
      .getByRole("row", { name: /Test/ })
      .getByRole("combobox");
    await expect(
      roleSelect.locator("option[value='community_building_lead']"),
    ).toHaveCount(1);
  });

  test("removing a member stages the removal until Save is clicked", async ({
    page,
  }) => {
    // Removing now asks for confirmation before staging.
    page.on("dialog", (d) => d.accept());
    // Join portland-university first so there's a second member to remove
    await page.goto("/teams/portland-university");
    await page.getByRole("button", { name: "Join team" }).click();
    await expect(page.getByRole("link", { name: "Edit" })).toBeVisible();

    await page.goto("/teams/portland-university/edit");
    const row = page.getByRole("row", { name: /Test/ });
    await expect(row).toBeVisible();

    await row.getByRole("button", { name: /^Remove/ }).click();
    await expect(row.getByRole("button", { name: "Undo" })).toBeVisible();

    // Not persisted yet — reloading still shows the member.
    await page.reload();
    await expect(page.getByRole("row", { name: /Test/ })).toBeVisible();
  });

  test("Undo restores a member staged for removal", async ({ page }) => {
    page.on("dialog", (d) => d.accept());
    await page.goto("/teams/portland-university");
    await page.getByRole("button", { name: "Join team" }).click();
    await page.goto("/teams/portland-university/edit");

    const row = page.getByRole("row", { name: /Test/ });
    await row.getByRole("button", { name: /^Remove/ }).click();
    await row.getByRole("button", { name: "Undo" }).click();

    await expect(row.getByRole("button", { name: /^Remove/ })).toBeVisible();
  });

  test("Cancel discards a staged member removal", async ({ page }) => {
    page.on("dialog", (d) => d.accept());
    await page.goto("/teams/portland-university");
    await page.getByRole("button", { name: "Join team" }).click();
    await page.goto("/teams/portland-university/edit");

    await page
      .getByRole("row", { name: /Test/ })
      .getByRole("button", { name: /^Remove/ })
      .click();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page).toHaveURL(/\/teams\/portland-university$/);

    await page.goto("/teams/portland-university/edit");
    await expect(page.getByRole("row", { name: /Test/ })).toBeVisible();
  });

  test("saving a staged removal removes the member from the table", async ({
    page,
  }) => {
    page.on("dialog", (d) => d.accept());
    await page.goto("/teams/portland-university");
    await page.getByRole("button", { name: "Join team" }).click();
    await page.goto("/teams/portland-university/edit");

    await page
      .getByRole("row", { name: /Test/ })
      .getByRole("button", { name: /^Remove/ })
      .click();
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page).toHaveURL(/\/teams\/portland-university$/);

    await page.goto("/teams/portland-university/edit");
    await expect(page.getByRole("row", { name: /Test/ })).toHaveCount(0);
  });
});
