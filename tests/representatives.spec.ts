import { test, expect } from "@playwright/test";
import { AUTH_STATE_PATH } from "./global-setup";

test.use({ storageState: AUTH_STATE_PATH });

test.describe("representatives page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/representatives");
  });

  test("renders heading and description", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Senators",
    );
    await expect(
      page.getByText("Current members of the U.S. Senate"),
    ).toBeVisible();
  });

  test("renders senators table with header columns", async ({ page }) => {
    await expect(page.getByRole("table")).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByRole("columnheader", { name: "Name" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "State" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Party" }),
    ).toBeVisible();
  });
});
