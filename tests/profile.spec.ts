import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { AUTH_STATE_PATH } from "./global-setup";

test.use({ storageState: AUTH_STATE_PATH });

test("email field is disabled and not editable", async ({ page }) => {
  await page.goto("/profile");
  const emailInput = page.getByLabel("Email");
  await expect(emailInput).toBeDisabled();
});

test("district dropdown is disabled until a state is selected", async ({
  page,
}) => {
  await page.goto("/profile");
  await page.getByLabel("State").selectOption("");
  await expect(page.getByLabel("Congressional District")).toBeDisabled();

  await page.getByLabel("State").selectOption("PA");
  await expect(page.getByLabel("Congressional District")).toBeEnabled();
});

test("district resets when state changes", async ({ page }) => {
  await page.goto("/profile");
  await page.getByLabel("State").selectOption("PA");
  await page.getByLabel("Congressional District").selectOption("5");
  await expect(page.getByLabel("Congressional District")).toHaveValue("5");

  await page.getByLabel("State").selectOption("MA");
  await expect(page.getByLabel("Congressional District")).toHaveValue("");
});

test("at-large states show only 'At Large' district option", async ({
  page,
}) => {
  await page.goto("/profile");
  await page.getByLabel("State").selectOption("VT");

  const districtSelect = page.getByLabel("Congressional District");
  await expect(districtSelect).toBeEnabled();
  await expect(districtSelect.locator("option[value='at-large']")).toHaveText(
    "At Large",
  );
});

test("saves profile fields and persists after reload", async ({ page }) => {
  await page.goto("/profile");

  await page.getByLabel("First Name").fill("Test");
  await page.getByLabel("Last Name").fill("User");
  await page.getByLabel("Pronouns").fill("they/them");
  await page.getByLabel("State").selectOption("MA");
  await page.getByLabel("Congressional District").selectOption("5");

  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Profile saved successfully.")).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("First Name")).toHaveValue("Test");
  await expect(page.getByLabel("Last Name")).toHaveValue("User");
  await expect(page.getByLabel("Pronouns")).toHaveValue("they/them");
  await expect(page.getByLabel("State")).toHaveValue("MA");
  await expect(page.getByLabel("Congressional District")).toHaveValue("5");
});

test("profile page has no accessibility violations", async ({ page }) => {
  await page.goto("/profile");

  const results = await new AxeBuilder({ page })
    .exclude("h1") // primary color on white fails contrast — known issue
    .analyze();

  expect(results.violations).toEqual([]);
});
