import { test, expect, type Page } from "@playwright/test";
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

    test("shows no project's story until its folder is opened (owner's rule)", async ({ page }) => {
      // Open projects wait in <template> elements, which the browser never renders.
      // innerText holds only what a visitor can see.
      const visible = await page.evaluate(() => document.body.innerText);
      for (const project of projects) {
        for (const part of ["context", "did", "result"] as const) {
          expect(visible).not.toContain(project[lang][part]);
          await expect(page.getByText(project[lang][part], { exact: true })).toHaveCount(0);
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

test.describe("no sideways scroll and no cut titles", () => {
  const sizes = [
    [360, 740],
    [390, 844],
    [430, 932],
    [740, 360],
    [1000, 800],
    [1440, 900],
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

test.describe("first visit of a session: the closed drawer", () => {
  for (const lang of locales) {
    const copy = site[lang];

    test(`starts closed, is pulled out when pressed, and hands focus to the first tab · ${lang}`, async ({
      page,
    }) => {
      const problems = watchConsole(page);
      await page.goto(`/${lang}/`);
      await page.evaluate(() => document.fonts.ready);
      const html = page.locator("html");
      const opener = page.getByRole("button", { name: copy.drawer.open });

      await expect(html).toHaveClass(/drawer-closed/);
      await expect(opener).toBeVisible();
      await expect(opener).toHaveAttribute("aria-expanded", "false");
      await expect(page.locator(".drawer__front")).toContainText(copy.drawer.pressToOpen);
      // the folders wait inside, out of sight and out of reach
      await expect(page.locator(".folder__tab").first()).toBeHidden();
      expect(
        await page.locator(".drawer__cabinet").evaluate((cabinet) => (cabinet as HTMLElement).inert),
      ).toBe(true);

      await opener.click();
      await expect(html).not.toHaveClass(/drawer-closed/);
      await expect(page.locator(".folder__tab").first()).toBeFocused();
      await expect(opener).toBeHidden();
      // the cabinet around the drawer goes once the folders have settled
      await expect(html).not.toHaveClass(/drawer-cased/);
      expect(problems).toEqual([]);
    });
  }

  test("a later visit in the same session finds it open", async ({ page }) => {
    await page.goto("/en/");
    await expect(page.locator("html")).toHaveClass(/drawer-closed/);
    await page.reload();
    await expect(page.locator("html")).not.toHaveClass(/drawer-closed/);
    await expect(page.locator(".folder__tab").first()).toBeVisible();
  });

  test("the entrance plays once per session", async ({ page }) => {
    await page.goto("/en/");
    await expect(page.locator("html")).toHaveClass(/is-entering/);

    await page.reload();
    await expect(page.locator("html")).not.toHaveClass(/is-entering/);
  });

  test("the closed drawer causes no sideways scroll", async ({ page }) => {
    for (const [width, height] of [
      [360, 740],
      [1440, 900],
    ] as const) {
      await page.setViewportSize({ width, height });
      for (const lang of locales) {
        await page.goto(`/${lang}/`);
        await page.evaluate(() => sessionStorage.clear());
        await page.reload();
        await expect(page.locator("html")).toHaveClass(/drawer-closed/);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, `${width} × ${height} · ${lang}`).toBeLessThanOrEqual(0);
      }
    }
  });

  test.describe("with reduced motion", () => {
    test.use({ contextOptions: { reducedMotion: "reduce" } });

    test("never animates, and the drawer opens without travelling", async ({ page }) => {
      await page.goto("/ar/");
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator("html")).not.toHaveClass(/is-entering/);
      await expect(page.locator("html")).toHaveClass(/drawer-closed/);

      const animations = await page.$$eval(
        ".folder, .hero__title, .drawer__hint, .drawer__front",
        (elements) => elements.map((element) => getComputedStyle(element).animationName),
      );
      expect(animations.every((name) => name === "none")).toBe(true);

      await page.getByRole("button", { name: site.ar.drawer.open }).click();
      await expect(page.locator("html")).not.toHaveClass(/drawer-closed/);
      await expect(page.locator(".folder__tab").first()).toBeFocused();
      // no Web Animations (the pull); CSS fades and transitions are fine
      const travels = await page.$$eval(
        ".drawer__cabinet, .drawer__front, .folder",
        (elements) =>
          elements
            .flatMap((element) => element.getAnimations())
            .filter((a) => a.constructor.name === "Animation").length,
      );
      expect(travels).toBe(0);
    });
  });
});

// Playwright's WebKit build for Windows has no Web Audio; the switch then stays hidden, as designed
const NO_AUDIO = "This browser build cannot play sound, so the switch is hidden";
const canPlaySound = (page: Page) => page.evaluate(() => "AudioContext" in window);

test.describe("drawer sounds", () => {
  test("are off at first; the switch turns them on, loads them only then, and is remembered", async ({
    page,
  }) => {
    await skipEntrance(page);
    const problems = watchConsole(page);
    const loaded: string[] = [];
    page.on("request", (request) => {
      if (/\/synth\.[\w-]+\.js$/.test(request.url())) loaded.push(request.url());
    });
    await page.goto("/en/");
    await page.evaluate(() => document.fonts.ready);
    test.skip(!(await canPlaySound(page)), NO_AUDIO);
    const toggle = page.getByRole("button", { name: site.en.sound.label });

    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await page.waitForTimeout(1500);
    expect(loaded).toHaveLength(0);

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => loaded.length).toBe(1);

    await page.reload();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(problems).toEqual([]);
  });

  test("with sound on, the pull, a picked folder and an opened file each play", async ({
    page,
  }, testInfo) => {
    await page.addInitScript(() => {
      localStorage.setItem("drawer-sound", "on");
      const played: string[] = [];
      (window as unknown as { played: string[] }).played = played;
      const start = AudioBufferSourceNode.prototype.start;
      AudioBufferSourceNode.prototype.start = function (...args: Parameters<typeof start>) {
        played.push(String(this.buffer?.duration.toFixed(2)));
        return start.apply(this, args);
      };
    });
    const problems = watchConsole(page);
    await page.goto("/en/");
    await page.evaluate(() => document.fonts.ready);
    test.skip(!(await canPlaySound(page)), NO_AUDIO);
    const played = () => page.evaluate(() => (window as unknown as { played: string[] }).played.length);
    const plays = async (action: () => Promise<void>) => {
      const before = await played();
      await action();
      await expect.poll(played).toBeGreaterThan(before);
    };

    await plays(() => page.getByRole("button", { name: site.en.drawer.open }).click());
    await expect(page.locator("html")).not.toHaveClass(/drawer-cased/);
    // the mouse over another folder picks it out (phones have no mouse)
    if (testInfo.project.name === "desktop") await plays(() => page.locator(".folder__tab").nth(2).hover());
    await plays(() => page.locator(".folder__tab").first().click());
    await expect(page.locator("dialog#file")).toBeVisible();
    expect(problems).toEqual([]);
  });
});
