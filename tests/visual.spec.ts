import { test, devices } from "@playwright/test";
import { locales } from "./helpers";

// Review screenshots for the owner (ship-check step 5). Saved, not compared: baselines come
// once the owner approves a set. Output: test-results/review/
test("review screenshots of the home page", async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "One set per run");

  const sizes = [
    ["desktop-1440", { viewport: { width: 1440, height: 900 } }],
    ["mobile-390", { ...devices["iPhone 13"], viewport: { width: 390, height: 844 } }],
  ] as const;

  for (const [name, options] of sizes) {
    for (const lang of locales) {
      const context = await browser.newContext({ ...options, baseURL: "http://localhost:4321" });
      await context.addInitScript(() => sessionStorage.setItem("entered", "1"));
      const page = await context.newPage();
      await page.goto(`/${lang}/`);
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: `test-results/review/home-${lang}-${name}.png`, fullPage: true });
      await context.close();
    }
  }
});
