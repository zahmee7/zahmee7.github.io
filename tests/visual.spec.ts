import { test, expect, devices } from "@playwright/test";
import { locales } from "./helpers";

// Review screenshots for the owner (ship-check step 5). Saved, not compared: baselines come
// once the owner approves a set. Output: test-results/review/
// States: home closed, a file open and a project page, desktop 1440 and mobile 390, ar and en.
test("review screenshots of the home page, closed and with a file open", async ({
  browser,
  baseURL,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "One set per run");

  const sizes = [
    ["desktop-1440", { viewport: { width: 1440, height: 900 } }],
    ["mobile-390", { ...devices["iPhone 13"], viewport: { width: 390, height: 844 } }],
  ] as const;

  for (const [name, options] of sizes) {
    for (const lang of locales) {
      const context = await browser.newContext({ ...options, baseURL });
      await context.addInitScript(() => sessionStorage.setItem("entered", "1"));
      const page = await context.newPage();
      await page.goto(`/${lang}/`);
      await page.evaluate(() => document.fonts.ready);
      // animations: "disabled" settles transitions first, so everything is shot in its final place
      await page.screenshot({
        path: `test-results/review/home-${lang}-${name}.png`,
        fullPage: true,
        animations: "disabled",
      });

      await page.locator(".folder__tab[aria-haspopup='dialog']").first().click();
      await expect(page.locator("dialog#file .file__title")).toBeFocused();
      await expect(page.locator("dialog#file [data-rise]").last()).toHaveCSS("opacity", "1");
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: `test-results/review/file-${lang}-${name}.png`, animations: "disabled" });

      // the open file's address is its project page: a reload shows that page
      await page.reload();
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: `test-results/review/project-${lang}-${name}.png`,
        fullPage: true,
        animations: "disabled",
      });
      await context.close();
    }
  }
});
