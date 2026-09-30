import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import projects from "../content/projects.json" with { type: "json" };
import { axeTags, locales, skipEntrance } from "./helpers";

const firstOpen = [...projects].sort((a, b) => a.order - b.order).find((project) => project.mvp)!.id;
const demos = projects
  .filter((project) => project.mvp && project.demo.status === "ready")
  .map((project) => project.id);

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

    test("a project page has no violations", async ({ page }) => {
      await page.goto(`/${lang}/projects/${firstOpen}/`);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator("[data-rise]").last()).toHaveCSS("opacity", "1");
      expect(await violations(page)).toEqual([]);
    });

    for (const id of demos) {
      test(`the ${id} demo has no violations, before and after opening its file`, async ({ page }) => {
        // Microsoft's frames are stubbed; the file's own content is not ours to check
        await page.route(
          /^https:\/\/([a-z0-9-]+\.)*(powerbi\.com|officeapps\.live\.com|onedrive\.live\.com|1drv\.ms)\//,
          (route) =>
            route.fulfill({
              status: 200,
              contentType: "text/html",
              body: "<!doctype html><title>stub</title>",
            }),
        );
        await page.goto(`/${lang}/demos/${id}/`);
        await page.evaluate(() => document.fonts.ready);
        // let the stamp finish pressing in, so its contrast is measured at full ink
        await expect(page.locator(".demo-sheet .stamp")).toHaveCSS("opacity", "1");
        expect(await violations(page)).toEqual([]);

        await page.locator("[data-live-open]").click();
        await expect(page.locator(".live iframe")).toHaveCount(1);
        const results = await new AxeBuilder({ page }).withTags(axeTags).exclude(".live iframe").analyze();
        expect(results.violations.map((violation) => violation.id)).toEqual([]);
      });
    }

    test("404 has no violations", async ({ page }) => {
      await page.goto(`/${lang}/not-in-the-drawer/`);
      expect(await violations(page)).toEqual([]);
    });
  });
}

// No skipEntrance: the first visit of a session shows the drawer closed
for (const lang of locales) {
  test(`home has no violations with the drawer closed · ${lang}`, async ({ page }) => {
    await page.goto(`/${lang}/`);
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator("html")).toHaveClass(/drawer-closed/);
    expect(await violations(page)).toEqual([]);
  });
}
