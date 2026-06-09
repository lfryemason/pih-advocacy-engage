import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { AUTH_STATE_PATH } from "./global-setup";
import { resetDatabase } from "./reset-db";

test.use({ storageState: AUTH_STATE_PATH });
test.beforeEach(resetDatabase);

const themes = ["light", "dark"] as const;

for (const theme of themes) {
  test(`meetings list page (${theme}) has no accessibility violations`, async ({
    page,
  }) => {
    await page.addInitScript((t) => {
      window.localStorage.setItem("theme", t);
    }, theme);
    await page.goto("/meetings");
    await page.waitForLoadState("networkidle");
    await page.evaluate((t) => {
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(t);
      document.documentElement.style.colorScheme = t;
    }, theme);

    const results = await new AxeBuilder({ page }).analyze();

    expect(results.violations).toEqual([]);
  });

  test(`meeting edit panel (${theme}) has no accessibility violations`, async ({
    page,
  }) => {
    await page.addInitScript((t) => {
      window.localStorage.setItem("theme", t);
    }, theme);
    await page.goto("/meetings");
    await page.waitForLoadState("networkidle");
    await page.evaluate((t) => {
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(t);
      document.documentElement.style.colorScheme = t;
    }, theme);

    // Expand a meeting row then enter edit mode so the edit form is in the DOM.
    await page
      .getByRole("button", { name: /Expand meeting with/ })
      .first()
      .click();
    await page.getByRole("button", { name: /Edit Meeting/i }).click();
    await expect(
      page.getByRole("button", { name: "Save changes" }),
    ).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();

    expect(results.violations).toEqual([]);
  });

  test(`delegation panel (${theme}) has no accessibility violations`, async ({
    page,
  }) => {
    await page.addInitScript((t) => {
      window.localStorage.setItem("theme", t);
    }, theme);
    await page.goto("/meetings");
    await page.waitForLoadState("networkidle");
    await page.evaluate((t) => {
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(t);
      document.documentElement.style.colorScheme = t;
    }, theme);

    // Expand a meeting row, enter edit mode so the delegation form is in DOM.
    await page
      .getByRole("button", { name: /Expand meeting with/ })
      .first()
      .click();
    await page.getByRole("button", { name: /Edit Meeting/i }).click();
    await expect(
      page.getByRole("combobox", { name: /search members/i }),
    ).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();

    expect(results.violations).toEqual([]);
  });
}
