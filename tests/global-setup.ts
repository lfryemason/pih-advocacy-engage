import { chromium, FullConfig } from "@playwright/test";
import * as fs from "fs";

export const TEST_EMAIL = "playwright@example.com";
export const TEST_PASSWORD = "Playwright1!";
export const AUTH_STATE_PATH = "playwright/.auth/user.json";

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL!;
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Try signing in first (user may already exist from a previous run)
  await page.goto(`${baseURL}/auth/login`);
  await page.getByLabel("Email").fill(TEST_EMAIL);
  await page.getByLabel("Password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Login" }).click();

  const loginSucceeded = await page
    .waitForURL((url) => !url.pathname.startsWith("/auth/"), { timeout: 8000 })
    .then(() => true)
    .catch(() => false);

  if (!loginSucceeded) {
    // User doesn't exist yet — sign up, then sign in
    await page.goto(`${baseURL}/auth/sign-up`);
    await page.getByLabel("Email").fill(TEST_EMAIL);
    await page.getByLabel("Password", { exact: true }).fill(TEST_PASSWORD);
    await page.getByLabel("Repeat Password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Sign up" }).click();
    await page.waitForURL((url) =>
      url.pathname.startsWith("/auth/sign-up-success"),
    );

    await page.goto(`${baseURL}/auth/login`);
    await page.getByLabel("Email").fill(TEST_EMAIL);
    await page.getByLabel("Password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Login" }).click();
    await page.waitForURL((url) => !url.pathname.startsWith("/auth/"));
  }

  fs.mkdirSync("playwright/.auth", { recursive: true });
  await page.context().storageState({ path: AUTH_STATE_PATH });
  await browser.close();
}
