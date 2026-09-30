// Share images (Open Graph, 1200 × 630) for the home page and each open project, in both languages.
// Run after a title or tag changes: npm run og. Output: public/og/<lang>/<name>.png, committed.
// The images carry only copy that is already public on the site (name, role, tags, titles).
// The thmanyah files are read from the git-ignored local folder and used only inside a local headless
// browser; nothing is uploaded. The licence allows the fonts in design work such as these images.
import { existsSync } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import { basename } from "node:path";
import { chromium } from "@playwright/test";

const FONT_DIR = "src/assets/fonts/thmanyah";
const FONTS = { display: "thmanyahserifdisplay-Bold.woff2", sans: "thmanyahsans-Regular.woff2" };
const ORIGIN = "http://og.local";
const SIZE = { width: 1200, height: 630 };

for (const file of Object.values(FONTS)) {
  if (!existsSync(`${FONT_DIR}/${file}`)) {
    console.error(
      `Missing ${FONT_DIR}/${file}. Copy the thmanyah files there first (scripts/check-fonts.mjs).`,
    );
    process.exit(1);
  }
}

const projects = JSON.parse(await readFile("content/projects.json", "utf8")).sort(
  (a, b) => a.order - b.order,
);
const site = JSON.parse(await readFile("content/site.json", "utf8"));
const tokens = await readFile("src/styles/tokens.css", "utf8");

const arabicIndic = "٠١٢٣٤٥٦٧٨٩";
const digits = (text, lang) => (lang === "ar" ? text.replace(/\d/g, (d) => arabicIndic[Number(d)]) : text);
const folio = (n, lang) => digits(String(n).padStart(2, "0"), lang);
const escape = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const base = `
  @font-face { font-family: "og display"; src: url(/fonts/${FONTS.display}) format("woff2"); font-weight: 700; }
  @font-face { font-family: "og sans"; src: url(/fonts/${FONTS.sans}) format("woff2"); font-weight: 400; }
  ${tokens}
  :root { --font-thmanyah-display: "og display"; --font-thmanyah-sans: "og sans"; --font-thmanyah-text: "og sans"; }
  * { box-sizing: border-box; }
  html, body { margin: 0; inline-size: ${SIZE.width}px; block-size: ${SIZE.height}px; overflow: hidden; }
  body {
    position: relative;
    background:
      radial-gradient(ellipse 70% 60% at 50% -12%, rgb(var(--c-lamp-rgb) / 0.12), transparent 70%),
      linear-gradient(180deg, var(--c-night-3) 0%, var(--c-night) 60%);
    color: var(--c-paper);
    font: var(--fw-ui) 24px / 1.4 var(--font-ui);
    -webkit-font-smoothing: antialiased;
  }
  .num { font: var(--fw-display) 38px / 1 var(--font-display); }
`;

function page(lang, style, body) {
  const dir = lang === "ar" ? "rtl" : "ltr";
  return `<!doctype html><html lang="${lang}" dir="${dir}"><head><meta charset="utf-8"><style>${base}${style}</style></head><body>${body}</body></html>`;
}

/** A project: its folder, pulled half out of the drawer, with the tag, the title and the byline. */
function projectImage(project, lang) {
  const copy = site[lang];
  const text = project[lang];
  const style = `
    .folder {
      position: absolute; inset: 150px 72px -40px;
      padding: 60px 72px;
      border-radius: 18px;
      background: ${project.tone};
      color: var(--c-ink);
      box-shadow: var(--sh-folder);
    }
    .tab {
      position: absolute; inset-block-end: calc(100% - 1px); inset-inline-start: 48px;
      display: flex; align-items: baseline; gap: 16px;
      min-inline-size: 250px; padding: 16px 28px 6px;
      border-radius: 14px 14px 0 0;
      background: ${project.tone};
    }
    .tag { margin: 0 0 18px; color: var(--c-teal); font-size: 22px; letter-spacing: 0.2em; text-transform: uppercase; }
    :lang(ar) .tag { font-size: 26px; letter-spacing: 0; text-transform: none; }
    h1 { max-inline-size: 17ch; margin: 0; font: var(--fw-display) 74px / 1.1 var(--font-display); text-wrap: balance; }
    :lang(ar) h1 { line-height: 1.3; }
    .by { position: absolute; inset-inline: 72px; inset-block-end: 84px; display: flex; justify-content: space-between; color: var(--c-ink-muted); }
  `;
  const body = `
    <div class="folder">
      <div class="tab"><span class="num">${folio(project.order, lang)}</span><span>${escape(text.short)}</span></div>
      <p class="tag">${escape(text.tag)}</p>
      <h1>${escape(text.title)}</h1>
      <div class="by"><span>${escape(copy.name)} · ${escape(copy.role)}</span><span>${escape(copy.hero.kicker)}</span></div>
    </div>
  `;
  return page(lang, style, body);
}

/** Home: the byline, the headline and the drawer's six folders climbing in a staircase. */
function homeImage(lang) {
  const copy = site[lang];
  const style = `
    .by { position: absolute; inset-inline-start: 72px; inset-block-start: 52px; color: var(--c-mist); }
    .by strong { display: block; color: var(--c-paper); font-weight: inherit; }
    .kicker { position: absolute; inset-inline-start: 72px; inset-block-start: 178px; margin: 0; color: var(--c-signal); font-size: 20px; letter-spacing: var(--ls-kicker); text-transform: uppercase; }
    :lang(ar) .kicker { font-size: 24px; letter-spacing: 0; }
    h1 { position: absolute; inset-inline-start: 72px; inset-block-start: 212px; margin: 0; font: var(--fw-display) 76px / 1.15 var(--font-display); }
    .drawer {
      position: absolute; inset-inline: 72px; inset-block: 344px -20px;
      border-radius: 18px 18px 0 0;
      background: linear-gradient(180deg, var(--c-drawer) 0%, var(--c-night-2) 100%);
      box-shadow: inset 0 0 0 1px var(--c-drawer-edge);
    }
    .folder {
      position: absolute; inset-inline: calc(40px - var(--i) * 4px); inset-block-start: calc(64px + var(--i) * 34px);
      block-size: 400px; border-radius: 14px; background: var(--tone); box-shadow: var(--sh-folder);
    }
    .folder span {
      position: absolute; inset-block-end: calc(100% - 1px);
      inset-inline-start: calc(20px + var(--i) * (100% - 200px) / 5);
      inline-size: 160px; padding: 8px 18px 2px;
      border-radius: var(--r-tab); background: var(--tone); color: var(--c-ink);
    }
  `;
  const folders = projects
    .map(
      (project, i) =>
        `<div class="folder" style="--i: ${i}; --tone: ${project.tone};"><span class="num">${folio(project.order, lang)}</span></div>`,
    )
    .join("");
  const body = `
    <p class="by"><strong>${escape(copy.name)}</strong>${escape(copy.role)}</p>
    <p class="kicker">${escape(copy.hero.kicker)}</p>
    <h1>${escape(copy.hero.h1)}</h1>
    <div class="drawer">${folders}</div>
  `;
  return page(lang, style, body);
}

const jobs = [];
for (const lang of ["ar", "en"]) {
  jobs.push({ file: `public/og/${lang}/home.png`, html: homeImage(lang) });
  for (const project of projects.filter((item) => item.mvp)) {
    jobs.push({ file: `public/og/${lang}/${project.id}.png`, html: projectImage(project, lang) });
  }
}

const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: SIZE });
let html = "";
await tab.route(`${ORIGIN}/**`, async (route) => {
  const { pathname } = new URL(route.request().url());
  if (pathname.startsWith("/fonts/")) {
    await route.fulfill({
      body: await readFile(`${FONT_DIR}/${basename(pathname)}`),
      contentType: "font/woff2",
    });
  } else {
    await route.fulfill({ body: html, contentType: "text/html; charset=utf-8" });
  }
});

for (const job of jobs) {
  html = job.html;
  await mkdir(job.file.slice(0, job.file.lastIndexOf("/")), { recursive: true });
  await tab.goto(`${ORIGIN}/${job.file}`);
  await tab.evaluate(() => document.fonts.ready);
  await tab.screenshot({ path: job.file });
  console.log(`  ${job.file}`);
}
await browser.close();
