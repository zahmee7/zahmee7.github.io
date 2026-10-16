# Project Files · Mohammed Alzahmah portfolio

Bilingual (English / Arabic) portfolio for Mohammed Alzahmah, a data management and governance specialist in Saudi Arabia who applies the NDMO standards and the National Data Index (NDI) in practice.

The site is a **file cabinet**. Each project is a paper folder in a drawer. The visitor picks a tab, the folder slides out of the drawer and opens as a two-page file: a short motion film, the story (context, what I did, result), a live demo with sample data, and templates to download.

## Talking to the owner

- The owner writes in Arabic. Reply in Arabic.
- Put English terms, commands, paths and file names on their own line or in a code block. Never place English words inside an Arabic sentence: mixed-direction text renders out of order on his screen.
- Keep replies short. Show what changed and what to check.

## Sources of truth (read before coding)

| File | Purpose |
|---|---|
| `content/projects.json` | All project copy in EN and AR. Never invent project facts. If something is missing, ask. |
| `content/site.json` | UI strings (nav, hero, labels, footer). |
| `design/tokens.css` | Colors, type, radii, spacing, motion tokens, generated from `DESIGN.md`. Copy to `src/styles/tokens.css` in Phase 1 and keep in sync. |
| `design/MOTION.md` | Motion spec, generated from `DESIGN.md` section 7. Follow its durations, easings and sequences. |
| `design/prototype/cabinet.html` | Approved interaction prototype (with `cabinet.css`, `cabinet.js`; `view.html` compares phone and desktop). Serve the project root locally and open `/design/prototype/view.html`. Motion style 1 is the approved one; styles 2 and 3 are kept only for comparison. `leaf-view.html` compares project page layouts; layout A (the spread) is the approved one. Match its feel; production code is a rewrite, not a copy. |
| `docs/PLAN.md` | Phases and acceptance criteria (Arabic). |
| `docs/PROMPTS.md` | The prompt for each phase. |
| `films/SCRIPTS.md` | Film scripts and export specs. |
| `DESIGN.md` | **Approved by the owner on 2026-09-30.** The single design source of truth. `tokens.css` and `MOTION.md` are regenerated from it. |

## Skills and their order

Installed for this project (`.claude/skills/` plus the `frontend-design` plugin declared in `.claude/settings.json`). Sources and licenses: `.claude/THIRD_PARTY_SKILLS.md`.

The goal is a high-end, Awwwards-level personal portfolio with one coherent visual language. It is not a SaaS template and not a dashboard. Skills serve that goal in this order:

| # | Skill | Role | Decides |
|---|---|---|---|
| 1 | `frontend-design` | Primary design skill | Visual direction, art direction, typography, layout, UI quality, avoiding generic AI-looking output |
| 2 | `web-design` | Design specification | Writing and updating `DESIGN.md`: art direction, type system, color system, grid, spacing, components, motion language, interaction and responsive behaviour |
| 3 | `mega-frontend-design` | Advanced implementation | How to build it: GSAP patterns, Lenis, Three.js, scroll-driven animation, micro-interactions, Arabic/RTL layout, performance |
| 3a | `gsap-*` (official GreenSock skills) | Technical reference under 3 | Correct GSAP API use: core, timeline, ScrollTrigger, plugins (Flip, SplitText, Observer), utils, framework cleanup, performance |

Rules that keep them from conflicting:

1. **Precedence.** Owner's brief and the hard rules in this file (confidentiality, accessibility, performance, bilingual RTL) come first. Then 1 → 2 → 3. On a pure GSAP API detail, the `gsap-*` skills override code snippets in `mega-frontend-design`.
2. **One visual style.** After `DESIGN.md` is approved, no skill may introduce a font, color, radius, shadow, easing or effect that is not in it. A new visual idea is proposed as a `DESIGN.md` change first and waits for the owner.
3. **`frontend-design`** sets direction inside the approved concept (the file cabinet). It does not swap the concept.
4. **`web-design`** is used for its Phase A and Phase B only (brief → `DESIGN.md` → owner confirms). Its Phase C code generation is not used; building follows the phases in `docs/PLAN.md`. Overrides for this project:
   - `DESIGN.md` is written in English. The site is bilingual EN/AR from day one (this overrides its "no i18n by default").
   - Fonts are the thmanyah typeface, self-hosted from the owner's licensed files (see Fonts under Stack). Not Fontsource, not Google Fonts URLs.
   - No Unsplash or stock images, no `lucide-react`. Icons are inline SVG.
   - Brand files in `references/design-systems/` and the crawl scripts are used only when the owner names a reference site or brand.
5. **`mega-frontend-design`** is an implementation library, not a style source. Ignore its archetype picker, font and palette suggestions, and "always use" effects (grain, glassmorphism, mesh gradients, bento grids, custom cursor) unless `DESIGN.md` asks for them. Its Framer Motion section does not apply (no React on the main site).
6. **Lenis and Three.js are optional.** Use them only if `DESIGN.md` calls for them and the performance budgets below still pass. Smooth scrolling must stay off when reduced motion is on.
7. When two skills disagree on something not covered here, stop and ask the owner.

## Stack

- **Astro**, latest stable (`npm create astro@latest`), static output, TypeScript `strict`.
- **CSS**: plain CSS with custom properties from `tokens.css` plus component-scoped `<style>`. Logical properties only (`margin-inline`, `padding-block`, `inset-inline-start`, `text-align: start`). No Tailwind, no CSS-in-JS.
- **i18n**: Astro i18n routing, locales `en` and `ar`, `prefixDefaultLocale: true`, so every page lives under `/en/` or `/ar/`. `<html lang dir>` is set per locale. The root `/` is a tiny page that sends the visitor to `/ar/` or `/en/` from `navigator.language` (with plain links as fallback).
- **Motion**:
  - GSAP (core and CustomEase) for the page pull: the picked folder nudges up and a full page of paper is pulled up from the bottom of the screen over the cabinet. No Flip.
  - CSS transitions for hover, focus and press micro-interactions.
  - The closed drawer's pull: the home page always starts with the drawer closed and the visitor opens it (owner decisions, 2026-10-01 and 2026-10-13): Web Animations keyframes sampled from simple physics in `src/components/cabinet/pull.ts`, transform only.
  - The browser's own cross-document view transitions between pages (`@view-transition` in `global.css`), not Astro's `<ClientRouter />`: the open file uses the back button, which the router would take over (owner decision, Phase 4). A project page's paper is named `leaf`: leaving for the cabinet it slides down, and the language switch and previous / next cross-fade. Browsers without support change page at once.
  - dotLottie (`@lottiefiles/dotlottie-web`) for small vector animations exported from After Effects.
- **Fonts**: the **thmanyah** typeface, chosen by the owner. Source files: `design/fonts/thmanyah/` (woff2 as delivered, plus `LICENSE.pdf` and `LICENSE-ar.pdf`; the Arabic licence prevails).
  - Three families, weights 300, 400, 500, 700, 900 (no 600): `thmanyah Serif Display` (headings), `thmanyah Serif Text` (long reading), `thmanyah Sans` (screen and UI). Each file covers Arabic and Latin, so EN and AR use the same stack.
  - Owner decisions: all headings use `thmanyah Serif Display`, and so do the folder tabs, number and name (2026-10-13). The project story (context, what I did, result) uses `thmanyah Serif Text`. Everything else (UI, labels, lead, demos) uses `thmanyah Sans`.
  - Digits are proportional (no `tnum`). Align number columns by design, not by font feature.
  - Swash letters and the slanted kashida are for display only, once per word at most, never in two neighbouring words, never in body text.
  - No other typeface. `DESIGN.md` dropped IBM Plex Mono; file kinds use Sans.
  - Preload only the two weights used above the fold. No Google Fonts requests in production.
  - **Licence (hard rules).** Web embedding is allowed only as part of the built site. Never commit the font files to any repository that is public, never upload them anywhere else, never link to them or list them as downloads. The deploy workflow gets them from a private source (set up in Phase 1). Do not subset, convert or edit the files, or change the font names inside them: the licence forbids any modification, so use the woff2 files exactly as delivered (hashed file names from the build are fine). Do not use the thmanyah name or logo in a way that suggests endorsement. The owner decided on 2026-09-30 not to ask thmanyah for written confirmation for now, so follow these rules strictly.
- **Demos**: the project's own file in a sample version, not a tool built in the page (owner decision, Phase 6): a Power BI report published to web, an Excel workbook (OneDrive embed, or a file on this site in Microsoft's viewer) or a PDF on this site. `src/components/demos/LiveFile.astro` shows it behind "Open the live file", so nothing loads from Microsoft until the visitor asks. Each demo's `kind` and `url` live in `content/projects.json`; a page exists once the demo is `ready`. The owner publishes from his own personal Microsoft account; never sign in to it. Owner steps: `docs/DEMOS.md`. An earlier version with Preact tools on sample data is kept on the local branch `demos-built-in`, not merged. Ask before adding anything over 40 KB gzipped.
- **Sound**: the drawer's sounds (pull, picked folder, opened file, locked folder) are drawn in code with Web Audio in `src/components/cabinet/synth.ts`: no audio files. Off by default (owner decision); `SoundSwitch.astro` turns them on and the choice is kept in `localStorage`. `synth.ts` loads only once sound is on.
- **Video**: self-hosted `<video>` (`src/components/film/`). Loops are muted, `playsinline`, start only when at least half in view and when reduced motion is off. Sources: AV1 MP4 first, H.264 MP4 fallback, AVIF poster, all `preload="none"`. Each film has an EN and an AR version (on-screen text, films/SCRIPTS.md); the loop has no text and serves both.
  - Scene lines and timings live in `content/projects.json` (`film.scenes`). They build the WebVTT captions (`/films/<id>/captions.<lang>.vtt`) and the text under the film.
  - Masters go in `films/<id>/` (`master-en`, `master-ar`, optional text-free `loop-master`, mp4 or mov) and are never committed. `npm run films` makes the web files in `src/assets/films/<id>/` and checks their size budgets. Film.astro shows a film only when its files exist, else the tile placeholder.
  - `npm run films:sample` draws sample films (marked "Sample film", no sound) for testing. `src/assets/films/` is git-ignored while only samples exist, so they never reach the live site. When the real films arrive, remove that line from `.gitignore` and commit the web files.
- **Images**: `astro:assets` (`<Picture>` with AVIF and WebP).
- **Share images**: `npm run og` (`scripts/og.mjs`) draws `public/og/<lang>/<name>.png` (1200×630, home and each open project) in headless Chromium with the local font files, which never leave the machine. The PNGs are committed. Rerun it after a title, tag or name changes.
- **Hosting**: GitHub Pages through GitHub Actions (`withastro/action`), repo `zahmee7.github.io`, on the owner's domain `https://alzahmah.com/` (registered and DNS at Cloudflare, records unproxied to GitHub Pages; the custom domain is set in the repo's Pages settings). No base path.
  - The digital card is a separate repo, `card`, served at `/card/`. Never create a route or folder named `card`, and never edit that repo.
  - `/mohammed-card/` is the card's old address: `public/mohammed-card/index.html` is the owner's redirect page to `/card/`, kept so old links still work. Do not build anything else there.
- **Tests**: Playwright (`@playwright/test`) with projects `desktop` (Chromium 1440×900), `pixel` (Pixel 7) and `iphone` (iPhone 15, WebKit), each run in `en` and `ar`. `@axe-core/playwright` for accessibility. Lighthouse CI for budgets. The tests build the site and serve `dist/` with `scripts/serve.mjs` on port 4330, which answers like GitHub Pages (`astro preview` sends headers that make WebKit fetch preloaded fonts twice).
- **Tooling**: npm, Node LTS (22 or newer), Prettier, `astro check`.

## Content model

`content/projects.json` is a top-level array. Load it with the content layer: `defineCollection({ loader: file('content/projects.json'), schema })` and validate with Zod. Each entry has `id`, `order`, `mvp`, `tone`, `demo`, `film`, `downloads`, and an `en` and `ar` block with `short`, `tag`, `title`, `summary`, `context`, `did`, `result`, `demoLabel`, `downloadLabel`.

Routes:

- `/[lang]/` the cabinet (home)
- `/[lang]/projects/[id]/` the opened file (one static page per project, shareable, own OG image). While a file is open on the cabinet, the address bar and tab title show this page (`pushState`), so a reload or a copied link lands here.
- `/[lang]/demos/[id]/` the live demo
- `/404`
- `/` is the "Coming soon" page while `comingSoon` is true in `src/i18n/ui.ts` (owner's request, 2026-10-16): every other page sends visitors there, unless this browser opened `/?preview` (`/?public` undoes it). The tests set the preview flag in `playwright.config.ts`. At launch set `comingSoon` and `launched` together.

Only projects with `"mvp": true` are published until Phase 9 (others render as locked folders marked "Coming soon").

## Confidentiality (hard rules)

The public site is a trailer. Details are for interviews.

- No entity-specific numbers of any kind: scores, counts of systems, datasets, findings or people, percentages, rankings, dates of assessments.
- Do not name the employer on project pages (the copy says "the entity"). No employer logo, no internal system names, no screenshots of internal tools, no colleague names.
- No wording about internal status such as audit findings in detail, "stalled", "next cycle".
- Demos use clearly fictional sample data ("Sample Authority", round numbers) and always show a visible "Sample data" badge. Check every demo file before it goes on the site (Excel and PDF sheet by sheet; for Power BI, what the report shows), and never publish from the employer's tenant.
- Downloads are generic templates built from scratch.
- Run the `confidentiality-check` skill before any commit that touches copy, samples, films or downloads.

## Copy style

- Plain, specific sentences. Use a comma, colon or period instead of an em dash.
- No inflated words (leverage, robust, seamless, cutting-edge, passionate, spearheaded).
- Do not end sentences with a trailing "-ing" clause.
- Arabic copy is written as Arabic, not translated word for word. Digits in Arabic UI use Arabic-Indic numerals (٠١٢٣).
- Copy changes happen in `content/*.json` only, never hard-coded in components.

## Accessibility (WCAG 2.2 AA)

- Folder tabs are `<button>` elements with `aria-controls` and `aria-expanded`.
- The open file is a full-screen native `<dialog>` opened with `showModal()`. Focus moves to its heading and returns to the tab on close. `Esc` and browser back close it.
- Visible focus ring: 3px, 2px offset, `--c-signal` on night and `--c-teal` on paper (signal is under 3:1 on paper). Surfaces on paper carry `.on-paper`.
- Touch targets at least 44×44 px.
- Text contrast at least 4.5:1 (paper on navy and ink on paper both pass; recheck any new color).
- Films have captions and a short text summary under them.
- `prefers-reduced-motion: reduce` replaces movement with fades of 150 ms or less and stops loops.

## Performance budgets (mobile, Lighthouse)

- Performance ≥ 90, Accessibility 100, Best Practices ≥ 95, SEO 100.
- LCP ≤ 2.0 s, CLS ≤ 0.05, INP ≤ 200 ms.
- JavaScript on the home page ≤ 70 KB gzipped.
- Fonts in the first view (owner decision, thmanyah files cannot be subset):
  - Home page ≤ 160 KB: two font files at most (Serif Display and Sans). The story font loads only when a file opens.
  - Project pages ≤ 240 KB: three font files at most (Serif Display, Serif Text and Sans, about 235 KB).
  - Demo pages follow the home page limit.
- Animate only `transform`, `opacity` and `filter`. No layout reads inside animation frames.

## Mobile behaviour

- Breakpoint at 900 px.
- Below it, the same drawer is shown closer: edge to edge, larger tabs (54 px tall) and a wider step, each tab showing its number and short title. Locked folders show a small lock in the tab.
- Tapping a folder nudges it and pulls the project page up from the bottom of the screen, as on desktop (`100dvh`, safe-area insets). Close with the button in the top bar. The Android back gesture closes the file (push a history entry on open).
- Test widths: 360, 390, 430 and landscape 740.

## Project structure

```
src/
  components/
    cabinet/   Cabinet.astro, Folder.astro, FileSheet.astro, cabinet.ts, pull.ts, sound.ts, synth.ts
    film/      Film.astro, film.ts
  assets/films/<id>/  film-<lang>.mp4, film-av1-<lang>.mp4, loop.mp4, loop-av1.mp4, poster.avif (npm run films)
    ui/        LangSwitch.astro, Button.astro, SampleBadge.astro, SoundSwitch.astro
    demos/     LiveFile.astro
  content.config.ts
  i18n/        ui.ts, utils.ts
  layouts/     Base.astro
  pages/
    index.astro
    404.astro
    [lang]/index.astro
    [lang]/projects/[id].astro
    [lang]/demos/[id].astro
    films/[id]/captions.[lang].vtt.ts
  styles/      tokens.css, global.css
public/
  downloads/
tests/
content/  design/  docs/  films/   (kit files, keep them)
```

## Working agreements

- Visitors see only the folders: nothing from inside a project is shown on the home page until its folder is opened (owner's rule).
- Do not write site code until the owner's brief is in `docs/BRIEF.md` and `DESIGN.md` is approved. Both are done (2026-09-30).
- Start each phase in plan mode. Show the plan, wait for approval, then build in small commits.
- Do not add dependencies outside this stack without asking.
- Ask before deleting or renaming files.
- Never commit secrets, analytics keys or anything from the owner's employer.
- Never commit the thmanyah font files. `.gitignore` covers `design/fonts/`, `src/assets/fonts/thmanyah/`, `*.woff2` and `*.otf`; keep it that way.

## Definition of done (every phase)

1. `npm run build` passes and `npm run check` reports 0 errors.
2. `npm test` is green in all Playwright projects, EN and AR.
3. No console errors or warnings in the browser.
4. Screenshots reviewed: desktop and 390 px, EN and AR, closed and open states.
5. Reduced-motion path checked.
6. `confidentiality-check` passed when copy or assets changed.
7. Committed with a clear message. Pushed when the owner says so.
