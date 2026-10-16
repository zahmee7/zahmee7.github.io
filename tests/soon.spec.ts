import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import site from "../content/site.json" with { type: "json" };
import { axeTags, watchConsole } from "./helpers";

// While the owner keeps the site to himself (src/i18n/ui.ts → comingSoon), visitors see only "Coming soon"
// at the root; the owner's browser opens /?preview once to see everything.
test.describe("coming soon", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  const onSoonPage = async (page: Page) => {
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(site.ar.soon.title);
  };

  test("the root says Coming soon in both languages, with the way to the card", async ({ page }) => {
    const problems = watchConsole(page);
    await page.goto("/");
    await onSoonPage(page);
    await expect(page.getByText(site.en.soon.title)).toBeVisible();
    for (const lang of ["ar", "en"] as const) {
      await expect(page.getByRole("link", { name: site[lang].nav.card })).toHaveAttribute(
        "href",
        site.links.card,
      );
    }
    const violations = (await new AxeBuilder({ page }).withTags(axeTags).analyze()).violations.map(
      (v) => v.id,
    );
    expect(violations).toEqual([]);
    expect(problems).toEqual([]);
  });

  test("every other page sends visitors to it", async ({ page }) => {
    for (const path of ["/ar/", "/en/", "/en/projects/ndi-readiness/", "/ar/not-in-the-drawer/"]) {
      await page.goto(path);
      await onSoonPage(page);
    }
  });

  test("/?preview opens the whole site in this browser, and /?public closes it again", async ({ page }) => {
    await page.goto("/?preview");
    await expect(page).toHaveURL(/\/(ar|en)\/$/);
    await page.goto("/ar/projects/ndi-readiness/");
    await expect(page).toHaveURL(/\/ar\/projects\/ndi-readiness\/$/);

    await page.goto("/?public");
    await onSoonPage(page);
    await page.goto("/ar/");
    await onSoonPage(page);
  });
});
