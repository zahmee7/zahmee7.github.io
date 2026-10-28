import { test, expect, type Page } from "@playwright/test";
import projects from "../content/projects.json" with { type: "json" };
import site from "../content/site.json" with { type: "json" };
import { locales, turnLabel, watchConsole, watchFonts } from "./helpers";

// The demo pages, /[lang]/demos/[id]/: the project's own file in a sample version (LiveFile.astro).
// A demo exists once content/projects.json marks it ready with a kind and a link.
type Kind = "powerbi" | "excel-onedrive" | "excel-viewer" | "pdf";
const open = projects.filter((project) => project.mvp);
const ready = open.filter((project) => project.demo.status === "ready");
const waiting = open.filter((project) => project.demo.status !== "ready");
const MICROSOFT =
  /^https:\/\/([a-z0-9-]+\.)*(powerbi\.com|officeapps\.live\.com|onedrive\.live\.com|1drv\.ms)\//;

/** Tests never reach Microsoft: its frames get a stub page, and every call is counted. */
async function stubMicrosoft(page: Page): Promise<string[]> {
  const calls: string[] = [];
  await page.route(MICROSOFT, async (route) => {
    calls.push(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<!doctype html><title>stub</title>",
    });
  });
  return calls;
}

function linkOf(project: (typeof ready)[number], lang: "ar" | "en"): string {
  const url = (project.demo as { url?: string | { ar: string; en: string } }).url!;
  return typeof url === "string" ? url : url[lang];
}

for (const lang of locales) {
  const copy = site[lang];

  test.describe(`demos · ${lang}`, () => {
    test("a demo without its file yet says Coming soon", async ({ page }) => {
      test.skip(waiting.length === 0, "Every demo is ready");
      const project = waiting[0]!;
      await page.goto(`/${lang}/projects/${project.id}/`);
      await page.getByRole("link", { name: project[lang].demoLabel }).click();
      await expect(page.locator("#toast")).toHaveText(copy.drawer.locked);
      await expect(page).toHaveURL(new RegExp(`/${lang}/projects/${project.id}/$`));
    });

    for (const project of ready) {
      const kind = (project.demo as { kind?: Kind }).kind!;
      const text = project[lang];
      const kindName = copy.demo.kinds[kind];

      test(`${project.id}: the sheet, the stamp, the way back, and the file only when asked`, async ({
        page,
      }) => {
        const problems = watchConsole(page);
        const calls = await stubMicrosoft(page);
        const response = await page.goto(`/${lang}/demos/${project.id}/`);

        expect(response?.status()).toBe(200);
        await expect(page).toHaveTitle(`${text.title} · ${kindName} · ${copy.name}`);
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(text.title);
        await expect(page.locator(".demo-sheet .stamp")).toHaveText(copy.demo.badge);
        await expect(page.locator(".demo-sheet .stamp")).toBeVisible();
        await expect(page.getByRole("link", { name: copy.demo.back })).toHaveAttribute(
          "href",
          `/${lang}/projects/${project.id}/`,
        );

        const frame = page.locator(".live iframe");
        const url = linkOf(project, lang);
        const first = (project.demo as { page?: string }).page;
        const report = kind === "powerbi" && first ? `${url}&pageName=${first}` : url;
        const wide = (page.viewportSize()?.width ?? 0) >= 900;
        if (kind === "powerbi" && wide) {
          // On a wide screen a report opens at once, on its first page: the visitor came here to see it
          // (owner, 2026-10-24). Its snapshot holds the frame until the report has drawn.
          await expect(frame).toHaveCount(1);
          await expect(page.locator(".live__poster")).toBeVisible();
        } else if (kind === "powerbi") {
          // A phone shows the snapshot and waits for the press: a report is megabytes (2026-10-26)
          await expect(page.locator(".live__poster")).toBeVisible();
          await expect(frame).toHaveCount(0);
          expect(calls).toEqual([]);
          await page.getByRole("button", { name: copy.demo.open }).click();
          await expect(frame).toHaveCount(1);
        } else {
          // nothing from the file loads with the page
          await expect(frame).toHaveCount(0);
          await expect(
            page.getByText(kind === "pdf" ? copy.demo.fromSite : copy.demo.fromMicrosoft),
          ).toBeVisible();
          expect(calls).toEqual([]);

          await page.getByRole("button", { name: copy.demo.open }).click();
          await expect(frame).toBeFocused();
        }
        await expect(frame).toHaveAttribute("title", `${text.title} · ${kindName}`);
        const src = await frame.getAttribute("src");
        if (kind === "excel-viewer") expect(src).toContain(encodeURIComponent(url));
        else expect(src).toBe(report);

        const newTab = kind === "powerbi" ? copy.demo.openPowerBI : copy.demo.newTab;
        await expect(page.getByRole("link", { name: newTab })).toHaveAttribute("target", "_blank");
        if (kind === "pdf" || kind === "excel-viewer") {
          await expect(page.getByRole("link", { name: copy.file.download })).toHaveAttribute("href", url);
        }
        expect(problems).toEqual([]);
      });

      test(`${project.id}: the demo card in the file opens it live on page three`, async ({ page }) => {
        await stubMicrosoft(page);
        await page.goto(`/${lang}/projects/${project.id}/`);
        await page.getByRole("button", { name: turnLabel(project, copy.file) }).click();
        // the card still links to the demo page, for a browser without scripts
        const card = page.getByRole("link", { name: text.demoLabel });
        await expect(card).toHaveAttribute("href", `/${lang}/demos/${project.id}/`);

        await card.click();
        await expect(page.locator('[data-page="3"]')).toBeVisible();
        await expect(page.locator('[data-page="3"] .live iframe')).toHaveCount(1);
        await expect(page).toHaveURL(new RegExp(`/${lang}/projects/${project.id}/$`));
      });
    }

    test("a demo page loads two font files within 160 KB", async ({ page }) => {
      test.skip(ready.length === 0, "No demo is ready yet");
      const { files, settled } = watchFonts(page);
      await page.goto(`/${lang}/demos/${ready[0]!.id}/`);
      await settled();

      expect(files.size).toBe(2);
      expect([...files.values()].reduce((sum, size) => sum + size, 0)).toBeLessThanOrEqual(160 * 1024);
    });
  });
}
