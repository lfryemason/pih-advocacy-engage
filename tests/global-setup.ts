import { chromium, FullConfig } from "@playwright/test";
import * as fs from "fs";
import { seedTestUser, resetDatabase } from "./reset-db";
import { TEST_EMAIL, TEST_PASSWORD } from "./seed";

export const AUTH_STATE_PATH = "playwright/.auth/user.json";

export default async function globalSetup(config: FullConfig) {
  await seedTestUser();
  await resetDatabase();

  const baseURL = config.projects[0].use.baseURL!;
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(`${baseURL}/auth/login`);
  await page.getByLabel("Email").fill(TEST_EMAIL);
  await page.getByLabel("Password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/auth/"));

  fs.mkdirSync("playwright/.auth", { recursive: true });
  await page.context().storageState({ path: AUTH_STATE_PATH });
  await browser.close();
}
