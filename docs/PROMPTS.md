# رسائل المراحل

```
Phase prompts · Project Files
```

لكل مرحلة رسالة جاهزة. انسخ الرسالة كما هي والصقها في جلسة جديدة، بعد اكتمال المرحلة التي قبلها. الرسائل بالإنجليزية لأنها موجهة لمساعد البرمجة.

كل رسالة تطلب منه أن يعرض الخطة أولاً وينتظر موافقتك.

---

## المرحلة ١: تجهيز المشروع

```
Phase 1 · Project setup.
Read CLAUDE.md, DESIGN.md, design/MOTION.md and docs/PLAN.md (phase 1) first.
Enter plan mode and show me the plan before writing anything.

Scope:
- Astro (latest stable), static output, TypeScript strict, npm, Prettier, astro check.
- i18n routing: locales en and ar, prefixDefaultLocale true, <html lang dir> per locale. Root / redirects from navigator.language with plain links as fallback. 404 page.
- Content collections for content/projects.json (file loader + Zod schema) and site.json.
- Copy design/tokens.css to src/styles/tokens.css. Base layout with global.css.
- thmanyah fonts: only the three files in DESIGN.md section 3, loaded with @font-face from a git-ignored folder, the two home-page files preloaded. Never commit font files. Propose how the GitHub Actions build gets them from a private source and wait for my answer before setting it up.
- Playwright projects desktop, pixel, iphone, each in en and ar, with @axe-core/playwright. One smoke test per locale.
- GitHub Actions workflow with withastro/action. Do not push.
Finish with the ship-check skill and report the results.
```

---

## المرحلة ٢: الدرج

```
Phase 2 · The drawer (home page, no pull motion yet).
Read CLAUDE.md, DESIGN.md (sections 1 to 6 and 9), design/MOTION.md sequences 1 and 2, docs/PLAN.md phase 2, and open design/prototype/cabinet.html to match its feel.
Enter plan mode and show me the plan first.

Build: masthead (byline, card link, language link), hero, the drawer with six folders (staircase tabs, locked folders with the Coming soon stamp, drawer-front caption on hover and focus), closing card, the phone drawer (the same box seen closer, larger tabs, lock icon on locked tabs), and the first-load entrance once per session.
Rules: all copy from content/*.json, logical properties only, visitors see only folders, fonts in the first view ≤ 160 KB.
Tests: keyboard path through every tab, axe clean, no horizontal overflow at 360, 390, 430 and 740 landscape.
Finish with ship-check.
```

---

## المرحلة ٣: سحب الملف

```
Phase 3 · The page pull.
Read DESIGN.md section 7, design/MOTION.md sequences 3 to 6, docs/PLAN.md phase 3, and study design/prototype/cabinet.js (openFile, closeFile, STYLES[1]). Use the gsap-* skills for API details.
Enter plan mode and show me the plan first.

Build the full-screen native <dialog> page: the folder nudge, the page pulled up from the bottom and slid back down on close (motion style 1 in design/prototype/cabinet.js); the sticky top bar with folio and close; two columns on desktop, one on phones; previous and next; history entry for back; reduced-motion fade; focus to the title on open and back to the tab on close.
Rules: GSAP core and CustomEase only, transforms and opacity only, no layout reads inside the animation, the page behind locked while the file is open.
Tests: open and close by button, Esc and browser back in en and ar on all three devices; reduced-motion path; no console errors.
Finish with ship-check.
```

---

## المرحلة ٤: صفحات المشاريع

```
Phase 4 · Project pages.
Read CLAUDE.md, DESIGN.md, design/MOTION.md sequence 7 and docs/PLAN.md phase 4.
Enter plan mode and show me the plan first.

Build /[lang]/projects/[id]/ for every mvp project with the same spread as the dialog, view transitions from the folder (transition:name="file-<id>"), per-project OG image, titles and descriptions, the direct-visit entrance, and the 404 "This file is not in the drawer." page.
Rules: fonts on project pages ≤ 240 KB, run confidentiality-check on anything shown.
Finish with ship-check.
```

---

## المرحلة ٥: الأفلام

```
Phase 5 · Films.
Read CLAUDE.md (Video), films/SCRIPTS.md, design/MOTION.md sequence 8 and docs/PLAN.md phase 5.
Enter plan mode and show me the plan first.

Build Film.astro and film.ts: tile placeholder until real files exist, loop video only when ≥ 50% visible and motion is allowed, full film with EN and AR WebVTT captions, text summary under the film. Prepare the ffmpeg commands from films/SCRIPTS.md for when I drop masters into films/<project-id>/.
Finish with ship-check and confidentiality-check on captions.
```

---

## المرحلة ٦: النسخ التجريبية

```
Phase 6 · Demos.
Read CLAUDE.md (Demos, Confidentiality), DESIGN.md (demo sheet, stamp, status colors, data display) and docs/PLAN.md phase 6. Load the dataviz skill before any chart.
Enter plan mode and show me the plan first.

Build three Preact islands (client:visible) at /[lang]/demos/[id]/: readiness tracker, classification helper, executive dashboard. Sample data in src/data/samples/*.json, fictional "Sample Authority", round numbers. The red Sample data stamp is always visible. Charts are hand-built SVG.
Ask me before adding any package over 40 KB gzipped.
Finish with ship-check and confidentiality-check.
```

---

## المرحلة ٧: القوالب للتحميل

```
Phase 7 · Downloads.
Read CLAUDE.md (Confidentiality) and docs/PLAN.md phase 7.
Enter plan mode and show me the plan first.

Create generic templates from scratch in public/downloads/: the readiness tracker (xlsx), the one-page classification guide (pdf) and the dashboard template (pbit, or a documented placeholder if a pbit cannot be produced here). Nothing may point to my employer.
Finish with confidentiality-check on every file.
```

---

## المرحلة ٨: الجودة والإطلاق

```
Phase 8 · Quality and launch.
Read CLAUDE.md (Performance budgets, Accessibility, Definition of done) and docs/PLAN.md phase 8.
Enter plan mode and show me the plan first.

Set up Lighthouse CI with the budgets in CLAUDE.md, fix what fails, run the full Playwright and axe suite, review screenshots at desktop and 390 px in en and ar with the file closed and open, and check the reduced-motion path. List anything still missing from me (LinkedIn URL, email).
Do not push until I say so.
```

---

## المرحلة ٩: المشاريع الثلاثة الباقية

```
Phase 9 · Remaining projects.
Read CLAUDE.md, docs/PLAN.md phase 9 and content/projects.json.
Enter plan mode and show me the plan first.

For national-data-catalog, open-data and governance-committee: film, demo, downloads and project page, then set mvp to true so the folders unlock. Ask me for any missing fact; never invent project details.
Finish with ship-check and confidentiality-check.
```
