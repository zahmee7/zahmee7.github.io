import type { Page } from "@playwright/test";

export const locales = ["ar", "en"] as const;

/** axe rule tags for WCAG 2.2 AA (CLAUDE.md > Accessibility). */
export const axeTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/** Marks the session as already entered, so the first-load entrance does not run. */
export async function skipEntrance(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("entered", "1");
    } catch {
      // storage can be blocked; the entrance then simply plays
    }
  });
}

/** Collects console errors, warnings and uncaught errors for the page's lifetime. */
export function watchConsole(page: Page): string[] {
  const problems: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") problems.push(message.text());
  });
  page.on("pageerror", (error) => problems.push(error.message));
  return problems;
}

/** Arabic-Indic digits, as the Arabic UI shows them. */
export function arabicDigits(text: string): string {
  return text.replace(/\d/g, (digit) => "٠١٢٣٤٥٦٧٨٩"[Number(digit)] ?? digit);
}
