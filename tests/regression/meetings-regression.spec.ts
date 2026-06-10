import { test, expect } from "@playwright/test";
import { AUTH_STATE_PATH } from "../global-setup";
import { resetDatabase } from "../reset-db";
import { themes, setTheme } from "./theme-utils";

test.use({ storageState: AUTH_STATE_PATH });
test.beforeEach(resetDatabase);

for (const theme of themes) {
  test.describe(`meetings list page (${theme})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/meetings");
      await page.waitForLoadState("networkidle");
      await setTheme(page, theme);
    });

    test("matches screenshot", async ({ page }) => {
      await expect(page).toHaveScreenshot(`meetings-list-${theme}.png`);
    });
  });

  test.describe(`meeting detail panel — expanded row (${theme})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/meetings");
      await page.waitForLoadState("networkidle");
      await setTheme(page, theme);
      const expandBtn = page
        .getByRole("button", { name: /Expand meeting with/ })
        .first();
      await expandBtn.click();
      await expect(
        page.getByRole("button", { name: /Edit Meeting/i }),
      ).toBeVisible();
    });

    test("matches screenshot", async ({ page }) => {
      await expect(page).toHaveScreenshot(`meetings-detail-${theme}.png`);
    });
  });

  test.describe(`meeting edit form (${theme})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/meetings");
      await page.waitForLoadState("networkidle");
      await setTheme(page, theme);
      const expandBtn = page
        .getByRole("button", { name: /Expand meeting with/ })
        .first();
      await expandBtn.click();
      await page.getByRole("button", { name: /Edit Meeting/i }).click();
      await expect(
        page.getByRole("button", { name: "Save changes" }),
      ).toBeVisible();
    });

    test("matches screenshot", async ({ page }) => {
      await expect(page).toHaveScreenshot(`meetings-edit-${theme}.png`);
    });
  });

  test.describe(`delegation form section (${theme})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/meetings");
      await page.waitForLoadState("networkidle");
      await setTheme(page, theme);
      const expandBtn = page
        .getByRole("button", { name: /Expand meeting with/ })
        .first();
      await expandBtn.click();
      await page.getByRole("button", { name: /Edit Meeting/i }).click();
      await expect(
        page.getByRole("button", { name: "Save changes" }),
      ).toBeVisible();
      const searchInput = page.getByRole("combobox", {
        name: /search members/i,
      });
      await searchInput.scrollIntoViewIfNeeded();
    });

    test("matches screenshot", async ({ page }) => {
      await expect(page).toHaveScreenshot(`meetings-delegation-${theme}.png`);
    });
  });
}
