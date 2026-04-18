import { defineConfig, devices } from "@playwright/test";
import { execSync } from "child_process";

// Load local Supabase env vars (SERVICE_ROLE_KEY, etc.) when not already set
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  try {
    const env = execSync("npx supabase status -o env", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    for (const line of env.split("\n")) {
      const match = line.match(/^(\w+)="?(.*?)"?$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2];
      }
    }
  } catch {
    // Supabase CLI not available or not running — CI sets env vars directly
  }
}

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  globalSetup: require.resolve("./tests/global-setup"),
  testDir: "./tests",
  /*
   * Test suite selection:
   * - TEST_SUITE=regression → only regression tests
   * - TEST_SUITE=e2e → only e2e tests (exclude regression)
   * - unset locally → skip regression (they only pass in CI)
   * - unset in CI → run everything
   */
  testMatch:
    process.env.TEST_SUITE === "regression"
      ? "**/regression/**/*.spec.ts"
      : undefined,
  testIgnore:
    process.env.TEST_SUITE === "regression"
      ? undefined
      : process.env.TEST_SUITE === "e2e" || !process.env.CI
        ? "**/regression/**"
        : undefined,
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? [["list"], ["html"]] : "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: "http://localhost:3000",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "PLAYWRIGHT=true npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
