import { Page } from "@playwright/test";

export const themes = ["light", "dark"] as const;
export type Theme = (typeof themes)[number];

export async function setTheme(page: Page, theme: Theme) {
  await page.evaluate((t) => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(t);
    document.documentElement.style.colorScheme = t;
  }, theme);
  // Wait for finite animations (CSS transitions from theme change) to settle.
  // Infinite animations (animate-spin, etc.) are excluded — they never stop.
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .filter(
        (a) => (a.effect?.getComputedTiming().iterations ?? 1) !== Infinity,
      )
      .every((a) => a.playState !== "running"),
  );
}
