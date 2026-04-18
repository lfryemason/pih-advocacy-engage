import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { AUTH_STATE_PATH } from "./global-setup";
import { resetDatabase } from "./reset-db";

test.use({ storageState: AUTH_STATE_PATH });
test.beforeAll(resetDatabase);

const themes = ["light", "dark"] as const;

for (const theme of themes) {
  test(`sidebar (${theme}) has no accessibility violations`, async ({
    page,
  }) => {
    await page.addInitScript((t) => {
      window.localStorage.setItem("theme", t);
    }, theme);
    await page.goto("/");
    await page.evaluate((t) => {
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(t);
      document.documentElement.style.colorScheme = t;
    }, theme);

    const results = await new AxeBuilder({ page }).analyze();

    expect(results.violations).toEqual([]);
  });
}
