import { test, expect, type Page } from "@playwright/test";
import site from "../content/site.json" with { type: "json" };
import { locales, watchConsole, watchFonts } from "./helpers";

// Accessibility checks live in a11y.spec.ts, drawer behaviour in cabinet.spec.ts.

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
      const fonts = watchFonts(page);
      await page.goto(`/${lang}/`);
      await fonts.settled();

      const fontBytes = [...fonts.files.values()].reduce((sum, size) => sum + size, 0);
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
      await expect(page.getByRole("link", { name: copy.footer.cardCta })).toHaveAttribute(
        "href",
        site.links.card,
      );
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
});
