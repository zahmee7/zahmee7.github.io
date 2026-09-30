import { test, expect, type Page } from "@playwright/test";
import projects from "../content/projects.json" with { type: "json" };
import site from "../content/site.json" with { type: "json" };
import { locales, skipEntrance, watchConsole } from "./helpers";

// The open file: the page pull, closing, previous / next (DESIGN.md section 7, MOTION.md 3 to 5).
const openProjects = projects.filter((project) => project.mvp).sort((a, b) => a.order - b.order);
const [first, second] = openProjects;
const last = openProjects[openProjects.length - 1]!;

async function openFile(page: Page, id: string): Promise<void> {
  await page.locator(`#tab-${id}`).click();
  await expect(page.locator("dialog#file")).toBeVisible();
  await expect(page.locator(`#file-title-${id}`)).toBeFocused();
}

async function expectClosedOn(page: Page, id: string): Promise<void> {
  await expect(page.locator("dialog#file")).toBeHidden();
  await expect(page.locator(`#tab-${id}`)).toBeFocused();
  await expect(page.locator(`#tab-${id}`)).toHaveAttribute("aria-expanded", "false");
}

for (const lang of locales) {
  const copy = site[lang];

  test.describe(`open file · ${lang}`, () => {
    test.beforeEach(async ({ page }) => {
      await skipEntrance(page);
      await page.goto(`/${lang}/`);
      await page.evaluate(() => document.fonts.ready);
    });

    test("each open project shows its own page, with focus on its title", async ({ page }) => {
      const problems = watchConsole(page);

      for (const project of openProjects) {
        await openFile(page, project.id);
        const text = project[lang];

        await expect(page.locator(`#tab-${project.id}`)).toHaveAttribute("aria-expanded", "true");
        await expect(page.locator("dialog#file")).toHaveAccessibleName(text.title);
        await expect(page.locator(".leaf__folio")).toContainText(copy.hero.kicker);
        await expect(page.locator("[data-folio]")).toHaveText(/^\S+ \/ \S+$/);
        for (const part of [text.tag, text.summary, text.context, text.did, text.result, text.demoLabel]) {
          await expect(page.locator("dialog#file").getByText(part, { exact: true })).toBeVisible();
        }

        await page.getByRole("button", { name: copy.file.close }).click();
        await expectClosedOn(page, project.id);
      }
      expect(problems).toEqual([]);
    });

    test("closes with Esc and with the browser back button", async ({ page }) => {
      const url = page.url();

      await openFile(page, first!.id);
      await page.keyboard.press("Escape");
      await expectClosedOn(page, first!.id);

      await openFile(page, first!.id);
      await page.goBack();
      await expectClosedOn(page, first!.id);
      expect(page.url()).toBe(url);
    });

    test("the address bar and tab title follow the open file", async ({ page }) => {
      await openFile(page, first!.id);
      await expect(page).toHaveURL(new RegExp(`/${lang}/projects/${first!.id}/$`));
      await expect(page).toHaveTitle(`${first![lang].title} · ${copy.name}`);

      await page.getByRole("button", { name: copy.file.next }).click();
      await expect(page.locator(`#file-title-${second!.id}`)).toBeFocused();
      await expect(page).toHaveURL(new RegExp(`/${lang}/projects/${second!.id}/$`));

      await page.keyboard.press("Escape");
      await expectClosedOn(page, second!.id);
      await expect(page).toHaveURL(new RegExp(`/${lang}/$`));
      await expect(page).toHaveTitle(copy.meta.title);

      // forward brings the file back, and a reload lands on its own page
      await page.goForward();
      await expect(page.locator(`#file-title-${second!.id}`)).toBeFocused();
      await page.reload();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(second![lang].title);
    });

    test("previous and next move between open projects", async ({ page }) => {
      const prev = page.getByRole("button", { name: copy.file.prev });
      const next = page.getByRole("button", { name: copy.file.next });

      await openFile(page, first!.id);
      await expect(prev).toHaveAttribute("aria-disabled", "true");

      await next.click();
      await expect(page.locator(`#file-title-${second!.id}`)).toBeFocused();
      await expect(page.locator(`#tab-${second!.id}`)).toHaveAttribute("aria-expanded", "true");
      await expect(page.locator(`#tab-${first!.id}`)).toHaveAttribute("aria-expanded", "false");

      for (let step = 2; step < openProjects.length; step += 1) {
        await next.click();
        await expect(page.locator(`#file-title-${openProjects[step]!.id}`)).toBeFocused();
      }
      await expect(next).toHaveAttribute("aria-disabled", "true");

      await page.getByRole("button", { name: copy.file.close }).click();
      await expectClosedOn(page, last.id);
    });

    test("keeps the page behind still while the file is open", async ({ page }) => {
      const overflow = () => page.evaluate(() => getComputedStyle(document.documentElement).overflow);

      await openFile(page, first!.id);
      expect(await overflow()).toBe("hidden");

      await page.keyboard.press("Escape");
      await expectClosedOn(page, first!.id);
      expect(await overflow()).not.toBe("hidden");
    });

    test("parts built later say Coming soon", async ({ page }) => {
      await openFile(page, first!.id);
      await page.getByRole("link", { name: first![lang].demoLabel }).click();

      const toast = page.locator("dialog#file #toast");
      await expect(toast).toHaveText(copy.drawer.locked);
      await expect(toast).toBeVisible();
      await expect(page.locator("dialog#file")).toBeVisible();
    });

    test("loads the story font by the time the file is open", async ({ page }) => {
      await openFile(page, first!.id);
      const families = await page.evaluate(async () => {
        await document.fonts.ready;
        return [...document.fonts].filter((face) => face.status === "loaded").map((face) => face.family);
      });
      expect(families.join(" | ")).toContain("thmanyah Serif Text");
    });

    test.describe("with reduced motion", () => {
      test.use({ contextOptions: { reducedMotion: "reduce" } });

      test("still opens, closes and returns focus", async ({ page }) => {
        await openFile(page, first!.id);
        const transform = await page.locator(".leaf").evaluate((leaf) => getComputedStyle(leaf).transform);
        expect(["none", "matrix(1, 0, 0, 1, 0, 0)"]).toContain(transform);

        await page.getByRole("button", { name: copy.file.close }).click();
        await expectClosedOn(page, first!.id);
      });
    });
  });
}
