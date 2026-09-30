import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { axeTags, locales, skipEntrance } from "./helpers";

async function violations(page: Page): Promise<string[]> {
  const results = await new AxeBuilder({ page }).withTags(axeTags).analyze();
  return results.violations.map((violation) => `${violation.id}: ${violation.help}`);
}

for (const lang of locales) {
  test.describe(`accessibility · ${lang}`, () => {
    test.beforeEach(async ({ page }) => {
      await skipEntrance(page);
    });

    test("home has no violations", async ({ page }) => {
      await page.goto(`/${lang}/`);
      await page.evaluate(() => document.fonts.ready);
      expect(await violations(page)).toEqual([]);
    });

    test("home has no violations while the drawer front shows a caption", async ({ page }) => {
      await page.goto(`/${lang}/`);
      await page.evaluate(() => document.fonts.ready);
      await page.locator(".folder__tab").first().focus();
      expect(await violations(page)).toEqual([]);
    });

    test("the open file has no violations", async ({ page }) => {
      await page.goto(`/${lang}/`);
      await page.evaluate(() => document.fonts.ready);
      const tab = page.locator(".folder__tab[aria-haspopup='dialog']").first();
      await tab.click();
      await expect(page.locator("dialog#file .file__title")).toBeFocused();
      // let the content finish rising, so contrast is measured at full opacity
      await expect(page.locator("dialog#file [data-rise]").last()).toHaveCSS("opacity", "1");
      expect(await violations(page)).toEqual([]);
    });

    test("404 has no violations", async ({ page }) => {
      await page.goto(`/${lang}/not-in-the-drawer/`);
      expect(await violations(page)).toEqual([]);
    });
  });
}
