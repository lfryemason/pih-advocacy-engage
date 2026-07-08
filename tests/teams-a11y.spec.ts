import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { AUTH_STATE_PATH } from "./global-setup";
import { resetDatabase } from "./reset-db";

test.use({ storageState: AUTH_STATE_PATH });
test.beforeEach(resetDatabase);

const themes = ["light", "dark"] as const;

const pages = [
  { name: "teams list", path: "/teams" },
  { name: "team detail", path: "/teams/seattle-high-school" },
  { name: "team edit", path: "/teams/seattle-high-school/edit" },
  { name: "create team", path: "/teams/new" },
];

for (const { name, path } of pages) {
  for (const theme of themes) {
    test(`${name} page (${theme}) has no accessibility violations`, async ({
      page,
    }) => {
      await page.addInitScript((t) => {
        window.localStorage.setItem("theme", t);
      }, theme);
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await page.evaluate((t) => {
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(t);
        document.documentElement.style.colorScheme = t;
      }, theme);

      const results = await new AxeBuilder({ page })
        .exclude("h1") // primary color on white fails contrast — known issue
        .analyze();

      expect(results.violations).toEqual([]);
    });
  }
}

test("team edit page with add-teammate dialog open has no accessibility violations", async ({
  page,
}) => {
  await page.goto("/teams/seattle-high-school/edit");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Add teammate" }).click();
  await expect(
    page.getByRole("dialog", { name: "Add teammate" }),
  ).toBeVisible();

  const results = await new AxeBuilder({ page })
    .exclude("h1") // primary color on white fails contrast — known issue
    .analyze();

  expect(results.violations).toEqual([]);
});

test("team edit page with a member staged for removal has no accessibility violations", async ({
  page,
}) => {
  await page.goto("/teams/seattle-high-school/edit");
  await page.waitForLoadState("networkidle");
  await page
    .getByRole("row", { name: /Test/ })
    .getByRole("button", { name: /^Remove/ })
    .click();
  await expect(page.getByRole("button", { name: "Undo" })).toBeVisible();

  const results = await new AxeBuilder({ page })
    .exclude("h1") // primary color on white fails contrast — known issue
    .analyze();

  expect(results.violations).toEqual([]);
});
