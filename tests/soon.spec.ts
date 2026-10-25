import { test, expect, type APIRequestContext, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import site from "../content/site.json" with { type: "json" };
import { axeTags, watchConsole } from "./helpers";

// What a new visitor finds. While the owner keeps the site to himself (src/i18n/ui.ts → comingSoon), visitors
// see only "Coming soon" at the root and the owner's browser opens /?preview once to see everything; since the
// launch (2026-10-25) every visitor reaches the whole site. Which state is set (src/i18n/ui.ts) is read from
// the built root page, so each group checks the state it belongs to and the other skips.

/** Whether the built site still shows "Coming soon" at its root. */
async function soonAtRoot(request: APIRequestContext): Promise<boolean> {
  const html = await (await request.get("/")).text();
  return html.includes(site.ar.soon.lead);
}
test.describe("coming soon", () => {
  test.beforeEach(async ({ request }) => {
    test.skip(!(await soonAtRoot(request)), "The site is launched: no Coming soon page");
  });
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

test.describe("launched", () => {
  test.beforeEach(async ({ request }) => {
    test.skip(await soonAtRoot(request), "The site still shows Coming soon");
  });
  // a new visitor: nothing in storage, no preview
  test.use({ storageState: { cookies: [], origins: [] } });

  test("the root leads a new visitor into the drawer", async ({ page }) => {
    const problems = watchConsole(page);
    await page.goto("/");
    await expect(page).toHaveURL(/\/(ar|en)\/$/);
    await expect(
      page.getByRole("button", { name: /^(افتح درج المشاريع|Open the project drawer)$/ }),
    ).toBeVisible();
    expect(problems).toEqual([]);
  });

  test("an open project's page opens straight from its link", async ({ page }) => {
    await page.goto("/ar/projects/executive-dashboard/");
    await expect(page).toHaveURL(/\/ar\/projects\/executive-dashboard\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("pages may be indexed", async ({ page }) => {
    for (const path of ["/", "/ar/", "/en/", "/ar/projects/executive-dashboard/"]) {
      await page.goto(path);
      await expect(page.locator('meta[name="robots"][content="noindex"]')).toHaveCount(0);
    }
  });
});
