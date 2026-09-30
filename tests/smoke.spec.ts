import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import site from "../content/site.json" with { type: "json" };

const locales = ["ar", "en"] as const;

/** Collects console errors, warnings and uncaught errors for the page's lifetime. */
function watchConsole(page: Page): string[] {
  const problems: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") problems.push(message.text());
  });
  page.on("pageerror", (error) => problems.push(error.message));
  return problems;
}

async function loadedFamilies(page: Page): Promise<string[]> {
  return page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts].filter((face) => face.status === "loaded").map((face) => face.family);
  });
}

for (const lang of locales) {
  const copy = site[lang];

  test.describe(`home · ${lang}`, () => {
    test("has the right language, direction, title and heading", async ({ page }) => {
      const problems = watchConsole(page);
      await page.goto(`/${lang}/`);

      await expect(page.locator("html")).toHaveAttribute("lang", lang);
      await expect(page.locator("html")).toHaveAttribute("dir", lang === "ar" ? "rtl" : "ltr");
      await expect(page).toHaveTitle(copy.meta.title);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(copy.hero.h1);
      expect(problems).toEqual([]);
    });

    test("loads the two thmanyah files used above the fold, and not the story font", async ({ page }) => {
      await page.goto(`/${lang}/`);
      const families = (await loadedFamilies(page)).join(" | ");

      expect(families).toContain("thmanyah Serif Display");
      expect(families).toContain("thmanyah Sans");
      expect(families).not.toContain("thmanyah Serif Text");
    });

    test("keeps first-view fonts within 160 KB", async ({ page }) => {
      let fontBytes = 0;
      page.on("response", async (response) => {
        if (response.url().endsWith(".woff2")) fontBytes += (await response.body()).length;
      });
      await page.goto(`/${lang}/`);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForLoadState("networkidle");

      expect(fontBytes).toBeGreaterThan(0);
      expect(fontBytes).toBeLessThanOrEqual(160 * 1024);
    });

    test("links to the other language and the digital card", async ({ page }) => {
      await page.goto(`/${lang}/`);
      const other = lang === "ar" ? "en" : "ar";

      await expect(page.getByRole("link", { name: copy.nav.langLabel })).toHaveAttribute(
        "href",
        `/${other}/`,
      );
      await expect(page.getByRole("link", { name: copy.nav.card })).toHaveAttribute("href", site.links.card);
    });

    test("has no accessibility violations", async ({ page }) => {
      await page.goto(`/${lang}/`);
      await page.evaluate(() => document.fonts.ready);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();

      expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
    });
  });
}

test.describe("root", () => {
  for (const [locale, expected] of [
    ["ar-SA", "/ar/"],
    ["en-US", "/en/"],
  ] as const) {
    test.describe(locale, () => {
      test.use({ locale });

      test(`sends a ${locale} browser to ${expected}`, async ({ page }) => {
        await page.goto("/");
        await expect(page).toHaveURL(new RegExp(`${expected}$`));
      });
    });
  }
});

test.describe("404", () => {
  test("answers unknown paths in both languages", async ({ page }) => {
    const response = await page.goto("/ar/not-in-the-drawer/");

    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(site.ar.notFound.title);
    await expect(page.getByRole("link", { name: site.ar.notFound.back })).toHaveAttribute("href", "/ar/");
    await expect(page.getByRole("link", { name: site.en.notFound.back })).toHaveAttribute("href", "/en/");
  });

  test("has no accessibility violations", async ({ page }) => {
    await page.goto("/en/not-in-the-drawer/");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
