import type { Page } from "@playwright/test";

export const locales = ["ar", "en"] as const;

/** axe rule tags for WCAG 2.2 AA (CLAUDE.md > Accessibility). */
export const axeTags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/** Marks the session as entered with the drawer opened, so the home page shows the open drawer at once. */
export async function skipEntrance(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("entered", "1");
      sessionStorage.setItem("drawer-open", "1");
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

/**
 * Records every font file a page loads, with its size. Call settled() once the page is open: it waits for
 * the fonts and their bodies, without waiting for the network to go quiet (a film loop never lets it).
 */
export function watchFonts(page: Page): { files: Map<string, number>; settled: () => Promise<void> } {
  const files = new Map<string, number>();
  const pending: Array<Promise<void>> = [];
  page.on("response", (response) => {
    if (!response.url().endsWith(".woff2")) return;
    pending.push(response.body().then((body) => void files.set(response.url(), body.length)));
  });
  return {
    files,
    settled: async () => {
      await page.evaluate(() => document.fonts.ready);
      await Promise.all(pending);
    },
  };
}

/** Arabic-Indic digits, as the Arabic UI shows them. */
export function arabicDigits(text: string): string {
  return text.replace(/\d/g, (digit) => "٠١٢٣٤٥٦٧٨٩"[Number(digit)] ?? digit);
}
