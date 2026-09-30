import { test, expect } from "@playwright/test";
import projects from "../content/projects.json" with { type: "json" };
import site from "../content/site.json" with { type: "json" };
import { arabicDigits, locales, skipEntrance, watchConsole } from "./helpers";

const ordered = [...projects].sort((a, b) => a.order - b.order);

for (const lang of locales) {
  const copy = site[lang];

  test.describe(`drawer · ${lang}`, () => {
    test.beforeEach(async ({ page }) => {
      await skipEntrance(page);
      await page.goto(`/${lang}/`);
      await page.evaluate(() => document.fonts.ready);
    });

    test("shows six folders in order, with locked ones marked", async ({ page }) => {
      const tabs = page.locator(".folder__tab");
      await expect(tabs).toHaveCount(6);

      for (const [index, project] of ordered.entries()) {
        const tab = tabs.nth(index);
        const number = String(project.order).padStart(2, "0");
        const note = project.mvp ? project[lang].summary : copy.drawer.locked;

        await expect(tab).toContainText(lang === "ar" ? arabicDigits(number) : number);
        await expect(tab).toContainText(project[lang].short);
        await expect(tab).toHaveAccessibleDescription(`${project[lang].title}. ${note}`);
        if (project.mvp) await expect(tab).not.toHaveAttribute("aria-disabled");
        else await expect(tab).toHaveAttribute("aria-disabled", "true");
      }
    });

    test("keyboard reaches every tab in order, with a visible focus ring", async ({ page }) => {
      const reached: string[] = [];
      for (let press = 0; press < 14 && reached.length < ordered.length; press += 1) {
        await page.keyboard.press("Tab");
        const id = await page.evaluate(() => document.activeElement?.id ?? "");
        if (id.startsWith("tab-") && !reached.includes(id)) reached.push(id);
      }
      expect(reached).toEqual(ordered.map((project) => `tab-${project.id}`));

      const ring = await page.evaluate(() => {
        const active = document.activeElement as HTMLElement;
        const style = getComputedStyle(active);
        return {
          visible: active.matches(":focus-visible"),
          style: style.outlineStyle,
          width: style.outlineWidth,
        };
      });
      expect(ring).toEqual({ visible: true, style: "solid", width: "3px" });
    });

    test("the drawer front captions the folder in focus or under the mouse", async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "desktop", "The caption is shown on wide screens only");
      const [first, , third] = ordered;

      await page.locator(".folder__tab").first().focus();
      await expect(page.locator("[data-caption-title]")).toHaveText(first![lang].title);
      await expect(page.locator("[data-caption-text]")).toHaveText(first![lang].summary);
      await expect(page.locator("[data-hint]")).toBeHidden();

      await page.locator(".folder__tab").first().blur();
      await page.locator(".folder__tab").nth(2).hover();
      await expect(page.locator("[data-caption-title]")).toHaveText(third![lang].title);
    });

    test("a locked folder says Coming soon", async ({ page }) => {
      const problems = watchConsole(page);
      const locked = ordered.findIndex((project) => !project.mvp);

      await page.locator(".folder__tab").nth(locked).click({ force: true });
      await expect(page.locator("#toast")).toHaveText(copy.drawer.locked);
      await expect(page.locator("#toast")).toHaveClass(/is-on/);
      expect(problems).toEqual([]);
    });

    test("keeps every project's story off the home page (owner's rule)", async ({ page }) => {
      const html = await page.content();
      for (const project of projects) {
        for (const part of ["context", "did", "result"] as const) {
          expect(html).not.toContain(project[lang][part]);
        }
      }
    });

    test("shows the whole drawer in the first view at 1440 × 900", async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "desktop", "Measured on the desktop project");
      const front = await page.locator(".drawer__front").boundingBox();
      const firstTab = await page.locator(".folder__tab").first().boundingBox();

      expect(front!.y + front!.height).toBeLessThanOrEqual(900);
      expect(firstTab!.y).toBeGreaterThanOrEqual(0);
    });
  });
}

test.describe("no sideways scroll on phones", () => {
  const sizes = [
    [360, 740],
    [390, 844],
    [430, 932],
    [740, 360],
  ] as const;

  for (const [width, height] of sizes) {
    for (const lang of locales) {
      test(`${width} × ${height} · ${lang}`, async ({ page }) => {
        await skipEntrance(page);
        await page.setViewportSize({ width, height });
        await page.goto(`/${lang}/`);
        await page.evaluate(() => document.fonts.ready);

        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        const cutTitles = await page.$$eval(
          ".folder__short",
          (titles) => titles.filter((title) => title.scrollWidth > title.clientWidth).length,
        );
        expect(overflow).toBeLessThanOrEqual(0);
        expect(cutTitles).toBe(0);
      });
    }
  }
});

test.describe("first-load entrance", () => {
  test("plays once per session", async ({ page }) => {
    await page.goto("/en/");
    await expect(page.locator("html")).toHaveClass(/is-entering/);

    await page.reload();
    await expect(page.locator("html")).not.toHaveClass(/is-entering/);
  });

  test.describe("with reduced motion", () => {
    test.use({ contextOptions: { reducedMotion: "reduce" } });

    test("never animates", async ({ page }) => {
      await page.goto("/ar/");
      await expect(page.locator("html")).not.toHaveClass(/is-entering/);

      const animations = await page.$$eval(".folder, .hero__title, .drawer__hint", (elements) =>
        elements.map((element) => getComputedStyle(element).animationName),
      );
      expect(animations.every((name) => name === "none")).toBe(true);
    });
  });
});
