import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { AUTH_STATE_PATH } from "./global-setup";

test.use({
  storageState: AUTH_STATE_PATH,
  viewport: { width: 400, height: 800 },
});

const themes = ["light", "dark"] as const;

for (const theme of themes) {
  test(`mobile header (${theme}) has no accessibility violations`, async ({
    page,
  }) => {
    await page.addInitScript((t) => {
      window.localStorage.setItem("theme", t);
    }, theme);
    await page.goto("/representatives");
    await page.evaluate((t) => {
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(t);
      document.documentElement.style.colorScheme = t;
    }, theme);

    const results = await new AxeBuilder({ page }).include("header").analyze();

    expect(results.violations).toEqual([]);
  });

  test(`mobile header dropdown (${theme}) has no accessibility violations`, async ({
    page,
  }) => {
    await page.addInitScript((t) => {
      window.localStorage.setItem("theme", t);
    }, theme);
    await page.goto("/representatives");
    await page.evaluate((t) => {
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(t);
      document.documentElement.style.colorScheme = t;
    }, theme);

    await page.getByRole("banner").click();
    await expect(page.getByRole("menu")).toBeVisible();

    // Radix aria-hides the rest of the page when the menu is open, which
    // triggers known false-positives for landmark/heading/region rules and
    // flags the (now-hidden) header Link as focusable. Scope axe to the
    // open menu content, which is what this test actually cares about.
    const results = await new AxeBuilder({ page })
      .include('[role="menu"]')
      .analyze();

    expect(results.violations).toEqual([]);
  });
}
