import { Page } from "@playwright/test";

export const themes = ["light", "dark"] as const;
export type Theme = (typeof themes)[number];

export async function setTheme(page: Page, theme: Theme) {
  await page.evaluate((t) => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(t);
    document.documentElement.style.colorScheme = t;
  }, theme);
  // Wait until all CSS transitions have finished rather than a fixed delay
  await page.waitForFunction(() =>
    document.getAnimations().every((a) => a.playState !== "running"),
  );
}
