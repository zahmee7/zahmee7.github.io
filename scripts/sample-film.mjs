// Sample films for testing the player until the real films arrive (owner's go-ahead, Phase 5).
// For each open project and language it draws the scenes of films/SCRIPTS.md frame by frame in headless
// Chromium, with the site's colours and fonts and the on-screen lines from content/projects.json, and
// writes films/<id>/master-<lang>.mp4 plus a text-free films/<id>/loop-master.mp4. `npm run films` then
// makes the web files. Every frame says "Sample film". No sound. Nothing here is committed (.gitignore).
// The fonts are read from the git-ignored local folder and never leave the machine.
// `node scripts/sample-film.mjs --stills` only saves a still from the middle of each scene to
// test-results/films/, to check the look without drawing whole films.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { once } from "node:events";
import { basename } from "node:path";
import { chromium } from "@playwright/test";

const FONT_DIR = "src/assets/fonts/thmanyah";
const FONTS = { display: "thmanyahserifdisplay-Bold.woff2", sans: "thmanyahsans-Regular.woff2" };
const ORIGIN = "http://film.local";
const SIZE = { width: 1920, height: 1080 };
const FPS = 30;
const LOOP_SECONDS = 6;
const PARALLEL = 4;
const STILLS = process.argv.includes("--stills");

for (const file of Object.values(FONTS)) {
  if (!existsSync(`${FONT_DIR}/${file}`)) {
    console.error(
      `Missing ${FONT_DIR}/${file}. Copy the thmanyah files there first (scripts/check-fonts.mjs).`,
    );
    process.exit(1);
  }
}

const projects = JSON.parse(await readFile("content/projects.json", "utf8"))
  .filter((project) => project.mvp && project.film.scenes?.length)
  .sort((a, b) => a.order - b.order);
const site = JSON.parse(await readFile("content/site.json", "utf8"));
const tokens = await readFile("src/styles/tokens.css", "utf8");
const tones = projects.map((project) => project.tone);

/** The film page: every element is placed by render(t), so any frame can be drawn at any time. */
function filmPage({ lang, project, showText }) {
  const copy = site[lang];
  const text = project[lang];
  const film = {
    scenes: project.film.scenes.map((scene) => ({
      start: scene.start,
      end: scene.end,
      lines: scene[lang].split(" · "),
    })),
    length: project.film.lengthSec,
  };
  const data = JSON.stringify({
    film,
    tones,
    showText,
    title: text.title,
    button: text.demoLabel,
    byline: `${copy.name} · ${copy.role}`,
  });
  return `<!doctype html><html lang="${lang}" dir="${lang === "ar" ? "rtl" : "ltr"}"><head><meta charset="utf-8"><style>
    @font-face { font-family: "film display"; src: url(/fonts/${FONTS.display}) format("woff2"); font-weight: 700; }
    @font-face { font-family: "film sans"; src: url(/fonts/${FONTS.sans}) format("woff2"); font-weight: 400; }
    ${tokens}
    :root { --font-thmanyah-display: "film display"; --font-thmanyah-sans: "film sans"; --font-thmanyah-text: "film sans"; }
    * { box-sizing: border-box; }
    html, body { margin: 0; inline-size: ${SIZE.width}px; block-size: ${SIZE.height}px; overflow: hidden; }
    body {
      position: relative;
      background: radial-gradient(ellipse 70% 60% at 50% -12%, rgb(var(--c-lamp-rgb) / 0.12), transparent 70%),
        linear-gradient(180deg, var(--c-night-3) 0%, var(--c-night) 65%);
      color: var(--c-paper); font: var(--fw-ui) 28px / 1.4 var(--font-ui); -webkit-font-smoothing: antialiased;
    }
    .badge { position: absolute; inset-block-start: 44px; inset-inline-end: 56px; padding: 8px 20px; border: 1.5px solid var(--c-signal); border-radius: 999px; color: var(--c-signal); font-size: 24px; }
    .card { position: absolute; left: 0; top: 0; width: 170px; height: 118px; padding: 18px 18px; border-radius: 10px; box-shadow: 0 10px 24px rgb(0 0 0 / 0.35); transform-origin: center; }
    .card i { display: block; height: 8px; margin-block-end: 12px; border-radius: 4px; background: rgb(var(--c-ink-rgb) / 0.18); }
    .card i:nth-child(2) { width: 70%; } .card i:nth-child(3) { width: 45%; }
    .card b { position: absolute; inset: 0; border-radius: 10px; background: var(--c-signal); opacity: 0; }
    .line { position: absolute; left: 300px; top: 560px; width: 1320px; height: 3px; background: var(--c-line-3); transform-origin: left center; transform: scaleX(0); }
    .dot { position: absolute; width: 34px; height: 34px; border-radius: 50%; border: 3px solid var(--c-lamp); opacity: 0; }
    .caption { position: absolute; inset-inline: 160px; inset-block-end: 110px; text-align: center; font: var(--fw-display) 60px / 1.25 var(--font-display); opacity: 0; }
    .caption span { display: block; }
    .closing { position: absolute; inset: 0; display: grid; place-content: center; justify-items: center; gap: 44px; opacity: 0; text-align: center; }
    .closing h1 { margin: 0; font: var(--fw-display) 96px / 1.2 var(--font-display); }
    .closing p { margin: 0; padding: 20px 44px; border-radius: 18px; background: var(--c-paper); color: var(--c-ink); font-size: 34px; }
    .closing small { position: absolute; inset-block-end: 72px; inset-inline: 0; color: var(--c-mist); font-size: 26px; }
  </style></head><body>
    <div id="stage"></div><div class="line" id="line"></div>
    <div class="caption" id="caption"></div>
    <div class="closing" id="closing"><h1 id="title"></h1><p id="button"></p><small id="byline"></small></div>
    <div class="badge">فيلم تجريبي · Sample film</div>
  <script>
    const D = ${data};
    const $ = (id) => document.getElementById(id);
    $("title").textContent = D.title; $("button").textContent = D.button; $("byline").textContent = D.byline;
    const N = 15, COLS = 5, CELL = [170, 118], GAP = 30;
    const rand = (i, k) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };
    const ease = (x) => { x = Math.min(1, Math.max(0, x)); return 1 - Math.pow(1 - x, 3); };
    const mix = (a, b, k) => a + (b - a) * k;
    const S = D.film.scenes;
    const at = (n) => S[n - 1] || S[S.length - 1];
    const cards = [], dots = [];
    for (let i = 0; i < N; i++) {
      const card = document.createElement("div"); card.className = "card";
      card.style.background = D.tones[i % D.tones.length];
      card.innerHTML = "<i></i><i></i><i></i><b></b>"; $("stage").append(card); cards.push(card);
    }
    const dim = [1, 4, 7, 8, 11, 13];           // the weak cells, which become the ranked list
    const impact = [0.9, 0.55, 0.75, 0.4, 0.65, 0.3];
    for (let k = 0; k < dim.length; k++) { const dot = document.createElement("div"); dot.className = "dot"; $("stage").append(dot); dots.push(dot); }
    const level = (i) => (dim.includes(i) ? 0.12 : 0.35 + rand(i, 3) * 0.45);
    const scatter = (i, t) => [160 + rand(i, 1) * 1440 + Math.sin(t * 0.6 + i) * 40, 120 + rand(i, 2) * 620 + Math.cos(t * 0.5 + i * 2) * 30, (rand(i, 4) - 0.5) * 50 + Math.sin(t * 0.8 + i) * 6];
    const grid = (i) => { const w = COLS * CELL[0] + (COLS - 1) * GAP; const c = i % COLS, r = Math.floor(i / COLS); return [(1920 - w) / 2 + c * (CELL[0] + GAP), 190 + r * (CELL[1] + GAP), 0]; };
    const listSlot = (k) => [300, 170 + k * 96];
    const timeSlot = (k) => [300 + k * 250, 360];

    window.render = (t) => {
      const s2 = at(2), s3 = at(3), s4 = at(4), s5 = at(5), s6 = at(6);
      const toGrid = ease((t - s2.start) / 2.5), light = ease((t - s3.start) / 1.5);
      const toList = ease((t - s4.start) / 2), sorted = ease((t - s4.start - 4) / 1.5);
      const toTime = ease((t - s5.start) / 2), fold = ease((t - s6.start) / 2);
      const order = dim.map((_, k) => k).sort((a, b) => impact[b] - impact[a]);
      cards.forEach((card, i) => {
        const a = scatter(i, t), g = grid(i);
        let x = mix(a[0], g[0], toGrid), y = mix(a[1], g[1], toGrid), r = mix(a[2], g[2], toGrid), w = 1, h = 1, o = 1;
        const k = dim.indexOf(i);
        if (k >= 0) {
          const rank = order.indexOf(k);
          const l = listSlot(mix(k, rank, sorted));
          x = mix(x, l[0], toList); y = mix(y, l[1], toList);
          w = mix(1, 1.4 + impact[k] * 4.6, toList * (1 - toTime));
          h = mix(1, 0.66, toList * (1 - toTime));
          const s = timeSlot(rank); x = mix(x, s[0], toTime); y = mix(y, s[1], toTime);
        } else {
          o = mix(1, 0.08, toList) * (1 - toTime);
        }
        // everything gathers into one card, then gives way to the closing card
        x = mix(x, 875, fold); y = mix(y, 420, fold); r = mix(r, 0, fold);
        o = mix(o, i === 0 ? 1 : 0, fold) * (1 - ease((t - s6.end + 3.2) / 0.4));
        card.style.transform = "translate(" + x + "px," + y + "px) rotate(" + r + "deg)";
        card.style.width = 170 * w + "px"; card.style.height = 118 * h + "px"; card.style.opacity = o;
        const pulse = k >= 0 ? 0.08 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2 / 3 + i)) : 0;
        card.querySelector("b").style.opacity = (level(i) + pulse) * light * (1 - toList * 0.6) * (1 - fold);
      });
      $("line").style.transform = "scaleX(" + toTime * (1 - fold) + ")";
      dots.forEach((dot, k) => { const s = timeSlot(order.indexOf(k)); dot.style.transform = "translate(" + (s[0] + 68) + "px,543px)"; dot.style.opacity = ease((t - s5.start - 2 - k * 0.3) / 0.6) * (1 - fold); });
      // captions: the lines of the scene now playing, the closing card in the last three seconds
      const closingOn = ease((t - (s6.end - 3)) / 0.5);
      $("closing").style.opacity = D.showText ? closingOn : 0;
      const scene = S.find((item) => t >= item.start && t < item.end) || S[S.length - 1];
      const last = scene === s6;
      const lines = last && scene.lines.length > 1 ? scene.lines.slice(0, -1) : last ? [] : scene.lines;
      const shown = lines.join("|");
      if ($("caption").dataset.lines !== shown) { $("caption").dataset.lines = shown; $("caption").innerHTML = lines.map((line) => "<span>" + line + "</span>").join(""); }
      const fade = Math.min(ease((t - scene.start - 0.3) / 0.5), ease((scene.end - 0.3 - t) / 0.5), last ? 1 - closingOn : 1);
      $("caption").style.opacity = D.showText ? fade : 0;
    };
  </script></body></html>`;
}

function encoder(file) {
  const proc = spawn(
    "ffmpeg",
    [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-f",
      "image2pipe",
      "-framerate",
      String(FPS),
      "-c:v",
      "mjpeg",
      "-i",
      "-",
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "14",
      "-pix_fmt",
      "yuv420p",
      file,
    ],
    { stdio: ["pipe", "inherit", "inherit"] },
  );
  return proc;
}

async function draw(page, job) {
  await page.goto(`${ORIGIN}/${job.file}`);
  await page.evaluate(() => document.fonts.ready);
  if (STILLS) {
    for (const scene of job.scenes) {
      const t = scene === job.scenes.at(-1) ? scene.end - 1 : (scene.start + scene.end) / 2;
      await page.evaluate((time) => window.render(time), t);
      const name = job.file
        .replace(/^films\//, "")
        .replace(/\//g, "-")
        .replace(".mp4", "");
      await page.screenshot({ path: `test-results/films/${name}-${t}s.png` });
    }
    console.log(`  stills for ${job.file}`);
    return;
  }
  const ffmpeg = encoder(job.file);
  const frames = Math.round((job.to - job.from) * FPS);
  for (let n = 0; n < frames; n++) {
    await page.evaluate((t) => window.render(t), job.from + n / FPS);
    const frame = await page.screenshot({ type: "jpeg", quality: 92 });
    if (!ffmpeg.stdin.write(frame)) await once(ffmpeg.stdin, "drain");
  }
  ffmpeg.stdin.end();
  const [code] = await once(ffmpeg, "close");
  if (code !== 0) throw new Error(`ffmpeg failed for ${job.file}`);
  console.log(`  ${job.file}  (${frames} frames)`);
}

const jobs = [];
for (const project of projects) {
  mkdirSync(`films/${project.id}`, { recursive: true });
  for (const lang of ["en", "ar"]) {
    jobs.push({
      file: `films/${project.id}/master-${lang}.mp4`,
      html: filmPage({ lang, project, showText: true }),
      from: 0,
      to: project.film.lengthSec,
      scenes: project.film.scenes,
    });
  }
  // text-free and seamless: the lit grid of the loop scene, after it has settled (its pulse repeats every 3 s)
  const loop = project.film.scenes[(project.film.loopScene ?? 3) - 1];
  jobs.push({
    file: `films/${project.id}/loop-master.mp4`,
    html: filmPage({ lang: "en", project, showText: false }),
    from: loop.start + 2,
    to: loop.start + 2 + LOOP_SECONDS,
    scenes: [{ start: loop.start + 2, end: loop.start + 2 }],
  });
}

if (STILLS) mkdirSync("test-results/films", { recursive: true });
const browser = await chromium.launch();
const pages = new Map();
const started = Date.now();
async function worker() {
  const page = await browser.newPage({ viewport: SIZE });
  await page.route(`${ORIGIN}/**`, async (route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname.startsWith("/fonts/")) {
      await route.fulfill({
        body: await readFile(`${FONT_DIR}/${basename(pathname)}`),
        contentType: "font/woff2",
      });
    } else {
      await route.fulfill({ body: pages.get(pathname.slice(1)), contentType: "text/html; charset=utf-8" });
    }
  });
  for (let job = jobs.shift(); job; job = jobs.shift()) {
    pages.set(job.file, job.html);
    await draw(page, job);
  }
}
console.log("Drawing sample films…");
await Promise.all(Array.from({ length: PARALLEL }, worker));
await browser.close();
console.log(`Done in ${Math.round((Date.now() - started) / 1000)} s. Next: npm run films`);
