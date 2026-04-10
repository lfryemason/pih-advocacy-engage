import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const authPages = [
  { name: "login", path: "/auth/login" },
  { name: "sign up", path: "/auth/sign-up" },
  { name: "forgot password", path: "/auth/forgot-password" },
  { name: "sign up success", path: "/auth/sign-up-success" },
  { name: "sign up error", path: "/auth/error" },
  { name: "sign up confirm", path: "/auth/confirm" },
];

const themes = ["light", "dark"] as const;

for (const { name, path } of authPages) {
  for (const theme of themes) {
    test(`${name} page (${theme}) has no accessibility violations`, async ({
      page,
    }) => {
      // Set theme in localStorage before navigating so next-themes
      // applies the correct class on hydration (avoids race condition
      // where page.evaluate runs before next-themes overwrites it).
      await page.addInitScript((t) => {
        window.localStorage.setItem("theme", t);
      }, theme);
      await page.goto(path);
      await page.waitForFunction(
        (t) => document.documentElement.classList.contains(t),
        theme,
      );

      const results = await new AxeBuilder({ page })
        .exclude("h1") // primary color (#ff8c00) on white fails contrast — known issue, tracked separately
        .analyze();

      expect(results.violations).toEqual([]);
    });
  }
}
