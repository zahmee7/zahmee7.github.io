import { test, expect, type Page } from "@playwright/test";
import projects from "../content/projects.json" with { type: "json" };
import site from "../content/site.json" with { type: "json" };
import { locales, watchConsole, watchFonts } from "./helpers";

// The project pages, /[lang]/projects/[id]/ (DESIGN.md > Page anatomy, MOTION.md sequence 6).
const sorted = [...projects].sort((a, b) => a.order - b.order);
const openProjects = sorted.filter((project) => project.mvp);
const locked = sorted.find((project) => !project.mvp)!;
const first = openProjects[0]!;
const second = openProjects[1]!;
const last = openProjects[openProjects.length - 1]!;

/** The share image named in og:image: served from this build, a PNG of 1200 × 630. */
async function expectShareImage(page: Page, name: string, lang: string): Promise<void> {
  const url = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(url).toBe(`https://alzahmah.com/og/${lang}/${name}.png`);

  const response = await page.request.get(new URL(url!).pathname);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("image/png");
  const png = await response.body();
  expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
}

for (const lang of locales) {
  const copy = site[lang];
  const other = lang === "ar" ? "en" : "ar";

  // No skipEntrance here: a fresh session shows that coming back from a project page skips the entrance.
  test.describe(`project page · ${lang}`, () => {
    test("each open project has its own page, with its title, story and share tags", async ({ page }) => {
      const problems = watchConsole(page);

      for (const project of openProjects) {
        const text = project[lang];
        const path = `/${lang}/projects/${project.id}/`;
        const response = await page.goto(path);

        expect(response?.status()).toBe(200);
        await expect(page.locator("html")).toHaveAttribute("lang", lang);
        await expect(page.locator("html")).toHaveAttribute("dir", lang === "ar" ? "rtl" : "ltr");
        await expect(page).toHaveTitle(`${text.title} · ${copy.name}`);
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(text.title);
        for (const part of [text.tag, text.summary, text.context, text.did, text.result]) {
          await expect(page.getByText(part, { exact: true })).toBeVisible();
        }
        await expect(page.getByRole("link", { name: text.demoLabel })).toBeVisible();

        await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", text.summary);
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
          "href",
          `https://alzahmah.com${path}`,
        );
        await expect(page.locator(`link[rel="alternate"][hreflang="${other}"]`)).toHaveAttribute(
          "href",
          `https://alzahmah.com/${other}/projects/${project.id}/`,
        );
        await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
          "content",
          `${text.title} · ${copy.name}`,
        );
        await expectShareImage(page, project.id, lang);

        // a reload lands on the same page
        await page.reload();
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(text.title);
      }
      expect(problems).toEqual([]);
    });

    test("the home page has a share image too", async ({ page }) => {
      await page.goto(`/${lang}/`);
      await expectShareImage(page, "home", lang);
    });

    test("a locked project has no page", async ({ page }) => {
      const response = await page.goto(`/${lang}/projects/${locked.id}/`);

      expect(response?.status()).toBe(404);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(site.ar.notFound.title);
    });

    test("close goes back to the drawer, without its first-load entrance", async ({ page }) => {
      await page.goto(`/${lang}/projects/${first.id}/`);

      await page.getByRole("link", { name: copy.file.close }).click();
      await expect(page).toHaveURL(new RegExp(`/${lang}/$`));
      await expect(page.locator("html")).not.toHaveClass(/is-entering/);
      await expect(page.locator(`#tab-${first.id}`)).toBeVisible();
    });

    test("previous, next and the language switch lead to the right pages", async ({ page }) => {
      await page.goto(`/${lang}/projects/${first.id}/`);
      await expect(page.getByRole("button", { name: copy.file.prev })).toBeDisabled();

      await page.getByRole("link", { name: copy.file.next }).click();
      await expect(page).toHaveURL(new RegExp(`/${lang}/projects/${second.id}/$`));
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(second[lang].title);

      await page.goto(`/${lang}/projects/${last.id}/`);
      await expect(page.getByRole("button", { name: copy.file.next })).toBeDisabled();

      await page.getByRole("link", { name: copy.nav.langLabel }).click();
      await expect(page).toHaveURL(new RegExp(`/${other}/projects/${last.id}/$`));
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(last[other].title);
    });

    test("parts built later say Coming soon", async ({ page }) => {
      await page.goto(`/${lang}/projects/${first.id}/`);
      await page.getByRole("link", { name: first[lang].downloadLabel }).click();

      await expect(page.locator("#toast")).toHaveText(copy.drawer.locked);
      await expect(page).toHaveURL(new RegExp(`/${lang}/projects/${first.id}/$`));
    });

    test("loads three font files within 240 KB, the story font among them", async ({ page }) => {
      const { files, settled } = watchFonts(page);
      await page.goto(`/${lang}/projects/${first.id}/`);
      await settled();

      const bytes = [...files.values()].reduce((sum, size) => sum + size, 0);
      expect(files.size).toBe(3);
      expect(bytes).toBeLessThanOrEqual(240 * 1024);
      const families = await page.evaluate(() =>
        [...document.fonts].filter((face) => face.status === "loaded").map((face) => face.family),
      );
      expect(families.join(" | ")).toContain("thmanyah Serif Text");
    });

    test("fits a 360 px phone with the bar on one line", async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 780 });
      await page.goto(`/${lang}/projects/${first.id}/`);
      await page.evaluate(() => document.fonts.ready);

      const size = await page.evaluate(() => ({
        page: document.documentElement.scrollWidth,
        bar: document.querySelector(".leaf__bar-inner")!.getBoundingClientRect().height,
      }));
      expect(size.page).toBeLessThanOrEqual(360);
      expect(size.bar).toBeLessThanOrEqual(60);
    });

    test.describe("with reduced motion", () => {
      test.use({ contextOptions: { reducedMotion: "reduce" } });

      test("shows the content at once", async ({ page }) => {
        await page.goto(`/${lang}/projects/${first.id}/`);
        const risers = page.locator("[data-rise]");
        await expect(risers.first()).toHaveCSS("opacity", "1", { timeout: 1000 });
        await expect(risers.last()).toHaveCSS("opacity", "1", { timeout: 1000 });
        await expect(risers.last()).toHaveCSS("translate", /^(none|0px)$/);
      });
    });
  });
}
