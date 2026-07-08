import { test, expect } from "@playwright/test";
import { AUTH_STATE_PATH } from "../global-setup";
import { resetDatabase } from "../reset-db";
import { themes, setTheme } from "./theme-utils";

test.use({ storageState: AUTH_STATE_PATH });
test.beforeEach(resetDatabase);

/*
 * Regression test for: native <select> popups rendering unreadable
 * (e.g. white-on-white) in Chrome on Windows when both the OS and the site
 * are in dark mode.
 *
 * Chromium keys the native option-list popup's colors off `color-scheme`,
 * but only if the <select> itself resolves to a real, non-transparent
 * background/text color — a `background-color: transparent` select gives
 * Chromium nothing to match the popup to, so it falls back to UA defaults
 * that can conflict with the inherited (theme) text color.
 *
 * The popup itself is a native OS/browser widget, not part of the page's
 * render tree, so it can't be captured with page.screenshot() (confirmed:
 * clicking/opening a <select> never appears in a Playwright screenshot,
 * even headless on Linux). So instead we assert directly on the computed
 * style responsible for the bug.
 */
for (const theme of themes) {
  test.describe(`select dropdown colors (${theme})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/profile");
      await page.waitForLoadState("networkidle");
      await setTheme(page, theme);
    });

    test("State and Congressional District selects have an opaque, theme-matched background", async ({
      page,
    }) => {
      for (const label of ["State", "Congressional District"]) {
        const select = page.getByLabel(label);
        const { backgroundColor, color } = await select.evaluate((el) => {
          const style = getComputedStyle(el);
          return { backgroundColor: style.backgroundColor, color: style.color };
        });

        expect(backgroundColor, `${label} select background`).not.toBe(
          "rgba(0, 0, 0, 0)",
        );
        expect(
          backgroundColor,
          `${label} select background must differ from its text color`,
        ).not.toBe(color);
      }
    });
  });
}
