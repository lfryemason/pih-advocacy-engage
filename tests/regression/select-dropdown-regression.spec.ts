import { test, expect } from "@playwright/test";
import { AUTH_STATE_PATH } from "../global-setup";
import { resetDatabase } from "../reset-db";
import { themes, setTheme } from "./theme-utils";

test.use({ storageState: AUTH_STATE_PATH });
test.beforeEach(resetDatabase);

/*
 * Regression test for: native <select> popups rendering unreadable
 * (e.g. white-on-white) in Chrome on Windows when the site is in dark mode.
 *
 * Firefox and light mode are fine; only Chromium on Windows breaks. The reason
 * is that Windows Chromium draws the option-list popup with a native OS menu
 * that does NOT follow `color-scheme` for the option rows. With the select's
 * text forced to the (light) foreground color and the options left with no
 * explicit background, the popup rows fall back to the native light menu
 * background — light text on a light row. The reliable fix across Chromium
 * versions is to set an explicit background AND color on the <option>s
 * themselves, which is what the shared <Select> now does.
 *
 * The popup itself is a native OS/browser widget, not part of the page's
 * render tree, so it can't be captured with page.screenshot() (confirmed:
 * opening a <select> never appears in a Playwright screenshot, even headless
 * on Linux). So instead we assert directly on the <option> computed style
 * responsible for the bug.
 */
for (const theme of themes) {
  test.describe(`select dropdown colors (${theme})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/profile");
      await page.waitForLoadState("networkidle");
      await setTheme(page, theme);
    });

    test("State and Congressional District options have an opaque, readable background", async ({
      page,
    }) => {
      for (const label of ["State", "Congressional District"]) {
        const select = page.getByLabel(label);
        const options = await select.evaluate((el) =>
          Array.from((el as HTMLSelectElement).options).map((opt) => {
            const style = getComputedStyle(opt);
            return {
              backgroundColor: style.backgroundColor,
              color: style.color,
            };
          }),
        );

        expect(options.length, `${label} should have options`).toBeGreaterThan(
          0,
        );
        for (const { backgroundColor, color } of options) {
          expect(backgroundColor, `${label} option background`).not.toBe(
            "rgba(0, 0, 0, 0)",
          );
          expect(
            backgroundColor,
            `${label} option background must differ from its text color`,
          ).not.toBe(color);
        }
      }
    });
  });
}
