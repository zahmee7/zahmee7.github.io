import { test, expect, type Page } from "@playwright/test";
import projects from "../content/projects.json" with { type: "json" };
import site from "../content/site.json" with { type: "json" };
import { locales, skipEntrance, watchConsole } from "./helpers";

// The film frame (Film.astro, film.ts, MOTION.md sequence 7) and the caption files.
// Video checks need the web films (npm run films:sample, or the real ones); without them they are skipped
// and the tile placeholder is checked instead.
const openProjects = projects.filter((project) => project.mvp).sort((a, b) => a.order - b.order);
const first = openProjects[0]!;
const lines = (text: string): string[] => text.split(" · ");
const scenesOf = (project: (typeof openProjects)[number]) => project.film.scenes ?? [];

const hasFilm = (page: Page): Promise<boolean> =>
  page
    .locator("[data-film]")
    .count()
    .then((count) => count > 0);

/** Whether this browser can decode one of the film formats (the test browsers differ). */
const canPlay = (page: Page): Promise<boolean> =>
  page.evaluate(() => {
    const video = document.createElement("video");
    return ['video/mp4; codecs="av01.0.05M.08"', 'video/mp4; codecs="avc1.640028"'].some(
      (type) => video.canPlayType(type) !== "",
    );
  });

const paused = (page: Page, selector: string): Promise<boolean> =>
  page.locator(selector).evaluate((video: HTMLVideoElement) => video.paused);

for (const lang of locales) {
  const copy = site[lang];

  test.describe(`film · ${lang}`, () => {
    test("the film as text lists each scene's lines in order", async ({ page }) => {
      await page.goto(`/${lang}/projects/${first.id}/`);
      const text = page.locator(".film__text");
      await expect(text.locator("li").first()).toBeHidden();

      await text.getByText(copy.file.transcript).click();
      const items = text.locator("li");
      await expect(items).toHaveCount(scenesOf(first).length);
      for (const [index, scene] of scenesOf(first).entries()) {
        for (const line of lines(scene[lang])) await expect(items.nth(index)).toContainText(line);
      }
    });

    test("caption files carry every scene of every film", async ({ request }) => {
      for (const project of openProjects) {
        const response = await request.get(`/films/${project.id}/captions.${lang}.vtt`);
        expect(response.status()).toBe(200);
        expect(response.headers()["content-type"]).toContain("text/vtt");

        const body = await response.text();
        expect(body.startsWith("WEBVTT\n")).toBe(true);
        expect(body.match(/ --> /g)).toHaveLength(scenesOf(project).length);
        for (const scene of scenesOf(project)) {
          for (const line of lines(scene[lang])) expect(body).toContain(line);
        }
      }
    });

    test("without film files the tiles stay and Play says Coming soon", async ({ page }) => {
      await page.goto(`/${lang}/projects/${first.id}/`);
      test.skip(await hasFilm(page), "This build has film files");

      await expect(page.locator(".film__tile")).toHaveCount(14);
      await page.getByRole("button", { name: copy.file.playFilm }).click();
      await expect(page.locator("#toast")).toHaveText(copy.drawer.locked);
    });

    test.describe("with the film files", () => {
      test.beforeEach(async ({ page }) => {
        await skipEntrance(page);
        await page.goto(`/${lang}/projects/${first.id}/`);
        test.skip(!(await hasFilm(page)), "No film files in this build (npm run films:sample)");
      });

      test("the loop plays silently while in view and stops when scrolled away", async ({ page }) => {
        test.skip(!(await canPlay(page)), "This test browser cannot decode the films");
        const problems = watchConsole(page);
        const loop = page.locator(".film__loop");
        await expect(loop).toHaveJSProperty("muted", true);
        await expect(loop).toHaveAttribute("playsinline", "");
        await expect(loop).toHaveAttribute("preload", "none");

        await page.locator(".film").scrollIntoViewIfNeeded();
        await expect.poll(() => paused(page, ".film__loop")).toBe(false);
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await expect.poll(() => paused(page, ".film__loop")).toBe(true);
        expect(problems).toEqual([]);
      });

      test("Play shows the full film with captions in both languages, the page's first", async ({ page }) => {
        await page.getByRole("button", { name: copy.file.playFilm }).click();

        const full = page.locator(".film__full");
        await expect(full).toBeVisible();
        await expect(full).toBeFocused();
        await expect(page.locator(".film__loop")).toBeHidden();
        await expect(page.getByRole("button", { name: copy.file.playFilm })).toBeHidden();

        const tracks = await full
          .locator("track")
          .evaluateAll((items) =>
            items.map((track) => [(track as HTMLTrackElement).srclang, (track as HTMLTrackElement).default]),
          );
        expect(tracks).toEqual([
          [lang, true],
          [lang === "ar" ? "en" : "ar", false],
        ]);
        if (await canPlay(page)) await expect.poll(() => paused(page, ".film__full")).toBe(false);
      });

      test.describe("with reduced motion", () => {
        test.use({ contextOptions: { reducedMotion: "reduce" } });

        test("nothing plays by itself", async ({ page }) => {
          await page.locator(".film").scrollIntoViewIfNeeded();
          await page.waitForTimeout(1200);
          // WebKit may still read the file's header despite preload="none", so check that nothing played
          const loop = await page
            .locator(".film__loop")
            .evaluate((video: HTMLVideoElement) => ({ paused: video.paused, played: video.played.length }));
          expect(loop).toEqual({ paused: true, played: 0 });
        });
      });
    });

    test("the open file's loop stops when the file closes", async ({ page }) => {
      await skipEntrance(page);
      await page.goto(`/${lang}/`);
      await page.locator(`#tab-${first.id}`).click();
      await expect(page.locator(`#file-title-${first.id}`)).toBeFocused();
      test.skip(!(await hasFilm(page)), "No film files in this build (npm run films:sample)");
      test.skip(!(await canPlay(page)), "This test browser cannot decode the films");

      await page.locator("dialog#file .film").scrollIntoViewIfNeeded();
      const loop = await page.locator("dialog#file .film__loop").elementHandle();
      await expect.poll(() => loop!.evaluate((video: HTMLVideoElement) => video.paused)).toBe(false);
      await page.keyboard.press("Escape");
      await expect(page.locator("dialog#file")).toBeHidden();
      expect(await loop!.evaluate((video: HTMLVideoElement) => video.paused)).toBe(true);
    });
  });
}
