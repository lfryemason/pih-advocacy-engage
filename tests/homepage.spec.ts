import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { AUTH_STATE_PATH } from "./global-setup";
import { resetDatabase } from "./reset-db";

test.use({ storageState: AUTH_STATE_PATH });
test.beforeEach(resetDatabase);

test.describe("homepage", () => {
  test("shows beta banner", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('[aria-label="Beta notice"]')).toBeVisible();
  });

  test("shows resources section with all four links", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /resources/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /pih engage resources/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /partners in health/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /tb fighter moc scoresheet/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /community discord/i }),
    ).toBeVisible();
  });
});

test.describe("homepage a11y", () => {
  for (const theme of ["light", "dark"] as const) {
    test(`has no accessibility violations (${theme})`, async ({ page }) => {
      await page.addInitScript((t) => {
        window.localStorage.setItem("theme", t);
      }, theme);
      await page.goto("/");
      await expect(page.locator('[aria-label="Beta notice"]')).toBeVisible();
      await page.evaluate((t) => {
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(t);
        document.documentElement.style.colorScheme = t;
      }, theme);

      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });
  }
});
