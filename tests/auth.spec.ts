import { test, expect } from "@playwright/test";

test.describe("login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/login");
    await page.waitForLoadState("networkidle");
  });

  test("renders branding and form", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Advocacy Tracking",
    );
    await expect(
      page.getByText("Login", { exact: true }).first(),
    ).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Login" })).toBeVisible();
  });

  test("links to sign up and forgot password", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Sign up" })).toHaveAttribute(
      "href",
      "/auth/sign-up",
    );
    await expect(
      page.getByRole("link", { name: "Forgot your password?" }),
    ).toHaveAttribute("href", "/auth/forgot-password");
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.getByLabel("Email").fill("invalid@example.com");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page.getByText(/invalid login credentials/i)).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe("sign up page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/sign-up");
    await page.waitForLoadState("networkidle");
  });

  test("renders branding and form", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Advocacy Tracking",
    );
    await expect(
      page.getByText("Sign up", { exact: true }).first(),
    ).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Repeat Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign up" })).toBeVisible();
  });

  test("links back to login", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Login" })).toHaveAttribute(
      "href",
      "/auth/login",
    );
  });

  test("shows error when passwords do not match", async ({ page }) => {
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Password", { exact: true }).fill("password123");
    await page.getByLabel("Repeat Password").fill("different123");
    await page.getByRole("button", { name: "Sign up" }).click();
    await expect(page.getByText("Passwords do not match")).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe("forgot password page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/forgot-password");
    await page.waitForLoadState("networkidle");
  });

  test("renders branding and form", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Advocacy Tracking",
    );
    await expect(
      page.getByText("Reset Your Password", { exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Send reset email" }),
    ).toBeVisible();
  });

  test("links back to login", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Login" })).toHaveAttribute(
      "href",
      "/auth/login",
    );
  });
});
