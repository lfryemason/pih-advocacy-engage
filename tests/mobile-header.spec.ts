import { test, expect } from "@playwright/test";
import { AUTH_STATE_PATH } from "./global-setup";
import { resetDatabase } from "./reset-db";

test.use({
  storageState: AUTH_STATE_PATH,
  viewport: { width: 400, height: 800 },
});
test.beforeAll(resetDatabase);

test.describe("mobile header", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/representatives");
  });

  test("renders header with logo and hides the sidebar", async ({ page }) => {
    const header = page.getByRole("banner");
    await expect(header).toBeVisible();
    await expect(
      header.getByRole("img", { name: "PIH Advocacy Engage" }),
    ).toBeVisible();
    await expect(page.locator("aside")).not.toBeVisible();
  });

  test("logo links to home", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  test("clicking anywhere on the header opens the dropdown", async ({
    page,
  }) => {
    await page.getByRole("banner").click();
    await expect(
      page.getByRole("menuitem", { name: "Meetings" }),
    ).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: "Representatives" }),
    ).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Teams" })).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: /profile/i }),
    ).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Logout" })).toBeVisible();
  });

  test("dropdown content spans the full screen width", async ({ page }) => {
    await page.getByRole("banner").click();
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    const menuBox = await menu.boundingBox();
    const viewport = page.viewportSize();
    // Radix may inset the content slightly to avoid viewport collisions; allow a small margin.
    expect(menuBox?.width).toBeGreaterThanOrEqual((viewport?.width ?? 0) - 20);
  });

  test("theme section is collapsed by default and expands on click", async ({
    page,
  }) => {
    await page.getByRole("banner").click();

    await expect(
      page.getByRole("menuitem", { name: /^light$/i }),
    ).not.toBeVisible();

    await page.getByRole("menuitem", { name: /^theme$/i }).click();

    await expect(
      page.getByRole("menuitem", { name: /^light$/i }),
    ).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /^dark$/i })).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: /high contrast/i }),
    ).toBeVisible();
  });

  test("selecting a theme applies it", async ({ page }) => {
    await page.getByRole("banner").click();
    await page.getByRole("menuitem", { name: /^theme$/i }).click();
    await page.getByRole("menuitem", { name: /^dark$/i }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("nav menu items navigate to the correct page", async ({ page }) => {
    await page.getByRole("banner").click();
    await page.getByRole("menuitem", { name: "Teams" }).click();
    await page.waitForURL("/teams");
  });

  test("reopening the menu resets the theme section to collapsed", async ({
    page,
  }) => {
    await page.getByRole("banner").click();
    await page.getByRole("menuitem", { name: /^theme$/i }).click();
    await expect(
      page.getByRole("menuitem", { name: /^light$/i }),
    ).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).not.toBeVisible();

    await page.getByRole("banner").click();
    await expect(
      page.getByRole("menuitem", { name: /^light$/i }),
    ).not.toBeVisible();
  });
});
