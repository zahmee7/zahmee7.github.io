# DESIGN.md · Project Files

> A night-blue filing cabinet under one warm lamp. Cream paper folders, set in thmanyah, that slide out of the drawer and open like a magazine spread.

Status: **approved by the owner on 2026-09-30**, after review in the interactive prototype. Changes from the first draft, all the owner's: the folders sit inside an open drawer box, the phone shows the same drawer seen closer, and a project opens as its own full page that is pulled up from the bottom of the screen (sections 4, 7 and 9). This file is the single design source of truth. `design/tokens.css` and `design/MOTION.md` are regenerated from it, and no font, color, radius, shadow, easing or effect may be used unless it is defined here.

Inputs: `docs/BRIEF.md`, `CLAUDE.md`, `design/tokens.css`, `design/MOTION.md`, `content/*.json`, thmanyah type guide and licence.

---

## 1. Visual Theme & Atmosphere

**Style**: Warm editorial dossier.
**Keywords**: paper, drawer, folio, spread, lamplight, hairline, ink stamp, calm.
**Tone**: warm, precise, confident, quietly crafted. Not a dashboard, not a SaaS template, not tech neon, not glassmorphism.
**Feel**: opening a well-kept archive drawer at night. The room is cool blue, one warm pool of light falls from above, and the paper looks printed, not rendered.

**Audience**: the data community (peers who know the NDMO standards and the NDI). They value practical detail and free templates.
**The one action**: open the digital card and get in touch. Templates and demos are the reason to stay, the card is where the visit ends.

**Interaction tier**: L2 (flowing), with a single signature moment: the page pull (one GSAP timeline). No pinning, no scroll-scrubbed scenes, no WebGL, no smooth-scroll library.
**Dependencies**: `gsap` (core and CustomEase), CSS transitions, the browser's cross-document view transitions (CSS only, no router), `IntersectionObserver`. Lenis, Three.js and ScrollTrigger are not used.

**What people remember**: the drawer and the pull. Six paper folders stand inside an open drawer; pick one and a full page of paper is pulled up over the cabinet, as if you had stepped into the file.

**Owner's rule**: visitors see only the folders. Nothing from inside a project (story, film, demo, downloads) is shown on the home page until its folder is opened.
**The quiet detail**: the red "Sample data" ink stamp. It lands on every demo with a small press, as if someone stamped the sheet by hand. On a site about data classification, the stamp is the joke that also does a job.

### Page anatomy

| Page | Composition |
|---|---|
| Home `/[lang]/` | Masthead (name and role as a byline, card link, language). Hero: kicker, then the H1 and the lead side by side (owner's choice, design A), so the drawer takes most of the first view: an open box (dark back wall, slanted side walls) with six folders standing inside, their tabs climbing in a staircase above the rim. The drawer front carries a cream label card in a metal holder, a caption line and a metal pull. On desktop the page is exactly one screen: the drawer fills what the masthead and the title leave, and its front meets the bottom edge like a drawer pulled out towards you (the cabinet is a size container; `--step` and `--visible-front` follow its height). Wide screens (≥ 1600 px) widen the container to 1440 px; short ones (≤ 820 px tall) tighten the masthead, title and front. Warm lamp light falls on the folders; paper has a lit top edge and a faint grain. No closing card: the masthead's card link is the one way to the card on this page (owner's decision). The drawer starts closed and is pulled out when pressed (Closed drawer). A switch for the drawer's sounds sits by the language switch, off at first (section 7, Sound). |
| Open file (full-screen dialog) | A full page of paper that covers the cabinet, like a new page. A sticky top bar: folio (`Project files · 1 / 6`) and the close button. Desktop, the spread (owner's choice): tag, title and the project summary at inline-start, a larger film beside them, the demo and download at the foot of that column; then the story across the page in three columns under an ink rule. Previous / next at the bottom. Phone: one column: tag, title, summary, film, story, demo and download. While it is open, the address bar shows the project page. |
| Project `/[lang]/projects/[id]/` | The same paper page at its own URL, for direct visits and sharing. The top bar adds the language switch, and its close becomes a link back to the drawer. Below 480 px the folio shows only its number. The closing card follows the page. |
| Share image (1200 × 630) | Night room. Home: byline, kicker, H1 and the six folders in their drawer. Project: its folder pulled half out, tab with folio and short title, tag, title, byline. Made by `npm run og`. |
| Demo `/[lang]/demos/[id]/` | One paper sheet on night, a back link and the language switch above it. Stamp at the top inline-end, the file's kind as a kicker, the project title and summary, then the project's own file in a frame (owner's decision): a waiting panel with "Open the live file" and where it loads from, swapped for the live frame on request. Under the frame: open in a new tab, and download for files on this site. The closing card follows. |
| 404 | An empty drawer slot and one line: "This file is not in the drawer." with a link back. |
| Coming soon `/` (for now, owner's request 2026-10-16) | While `comingSoon` is true (`src/i18n/ui.ts`), the root is the only page visitors see: the byline in both languages, the closed drawer front with a red "Coming soon" stamp pressed on its label, then "Coming soon." and one note in Arabic and in English side by side (stacked on phones), each with the link to the digital card. Every other page sends visitors there; the owner opens `/?preview` once to see the whole site and `/?public` to see it as a visitor again. |

---

## 2. Color Palette & Roles

```css
:root {
  /* Night: the room (backgrounds) */
  --c-night: #080F1C;          /* page background */
  --c-night-2: #0F1A2F;        /* raised surface on night */
  --c-night-3: #0F1E3A;        /* top of the room, background gradient start */
  --c-line: #1B2740;           /* decorative hairline on night */
  --c-line-2: #2A3A58;         /* decorative border on night */
  --c-line-3: #63728C;         /* control border on night (≥3:1 on night, night-2, drawer) */

  /* Text on night */
  --c-paper-hi: #FFFDF8;       /* primary button hover on night */
  --c-mist: #B3B2AE;           /* secondary text (9.0:1) */
  --c-mist-2: #8E97A6;         /* tertiary text (6.5:1) */
  --c-signal: #62C3DB;         /* accent and focus ring on night (9.5:1) */

  /* Light: warmth only, never text */
  --c-lamp: #F2D7A0;

  /* Drawer */
  --c-drawer: #12264A;
  --c-drawer-edge: #23426F;
  --c-drawer-handle: #0B1628;

  /* Paper */
  --c-paper: #F4F0E8;          /* open file, demo sheet, primary button on night */
  --c-paper-line: #D9D2C4;     /* hairlines and page spine on paper, decorative only */
  --c-folder-1: #F1EDE4;
  --c-folder-2: #E8E1D3;
  --c-folder-3: #EFE8DA;
  --c-folder-4: #E3DACA;
  --c-folder-5: #ECE5D6;
  --c-folder-6: #DED4C1;

  /* Ink (text on paper) */
  --c-ink: #0B1628;            /* 15.9:1 on paper */
  --c-ink-2: #232C3B;          /* 12.4:1 on paper */
  --c-ink-muted: #5A6474;      /* 5.3:1 on paper, not on folders */
  --c-teal: #1F6F86;           /* accent and focus ring on paper (5.0:1) */
  --c-stamp: #9A3A24;          /* ink stamp (6.2:1 on paper, 4.8:1 on folder-6) */

  /* Demo status colors (sample data only, on --c-paper only) */
  --c-ok: #2E6A4B;             /* 5.6:1 */
  --c-warn: #8A5A00;           /* 5.2:1 */
  --c-gap: var(--c-stamp);

  /* Film */
  --c-film: #12264A;
  --c-film-tile: #1B3358;
  --c-film-lit: #62C3DB;

  /* RGB helpers, space separated: rgb(var(--c-night-rgb) / 0.6) */
  --c-night-rgb: 8 15 28;
  --c-paper-rgb: 244 240 232;
  --c-ink-rgb: 11 22 40;
  --c-signal-rgb: 98 195 219;
  --c-lamp-rgb: 242 215 160;
  --c-stamp-rgb: 154 58 36;

  /* Focus ring color, set per surface */
  --focus: var(--c-signal);
}

.on-paper { --focus: var(--c-teal); }
```

| Template role | Token |
|---|---|
| `--bg` | `--c-night` |
| `--surface` | `--c-night-2` on night, `--c-paper` for the file |
| `--surface-alt` | `--c-drawer` |
| `--border` / `--border-hover` | `--c-line-3` / `--c-mist` on night, `--c-ink-muted` / `--c-ink` on paper |
| `--text` / `--text-secondary` / `--text-tertiary` | on night: `--c-paper` / `--c-mist` / `--c-mist-2`. On paper: `--c-ink` / `--c-ink-2` / `--c-ink-muted` |
| `--accent` | `--c-signal` on night, `--c-teal` on paper |
| `--success` / `--warning` / `--error` | `--c-ok` / `--c-warn` / `--c-gap` |

**Color rules**

- Components reference tokens only. No hex values outside `tokens.css`.
- Two worlds, never mixed: night surfaces take night text colors, paper surfaces take ink colors. Any element that sits on paper gets `.on-paper` so the focus ring turns teal.
- Folder faces (`--c-folder-*`) take `--c-ink` and `--c-ink-2` only. `--c-ink-muted` and `--c-teal` drop below 4.5:1 on the darker folders.
- One accent per surface: signal on night, teal on paper. The stamp red is for stamps and the "gap" status only.
- `--c-lamp` appears only as a low-alpha glow in the background. Never as text, border or fill.
- `--c-line`, `--c-line-2` and `--c-paper-line` are decorative. Anything a user must see to operate (button edges, input borders) uses `--c-line-3` on night or `--c-ink-muted` on paper.
- Status in demos is never color alone: every status also has a text label or icon.

---

## 3. Typography Rules

**Typeface**: thmanyah, the only family on the site. Each file covers Arabic and Latin, so EN and AR use the same stacks. Self-hosted from the owner's licensed files; no Google Fonts, no Fontsource. Licence rules are in `CLAUDE.md` (never public in a repository, never modified, never offered for download).

**Exactly three files load, site-wide:**

| File | Role | Size | Where it loads |
|---|---|---|---|
| `thmanyahserifdisplay-Bold.woff2` | headings, folder numbers | 80 KB | everywhere, preloaded |
| `thmanyahsans-Regular.woff2` | UI, lead, labels, buttons, demos | 76 KB | everywhere, preloaded |
| `thmanyahseriftext-Regular.woff2` | project story | 78 KB | project pages (preloaded) and when a file opens on home |

Home and demo pages: 156 KB (limit 160). Project pages: 234 KB (limit 240). The `url()` paths below are placeholders; Phase 1 sets the real location inside the git-ignored font folder.

```css
@font-face {
  font-family: "thmanyah Serif Display";
  src: url("/fonts/thmanyahserifdisplay-Bold.woff2") format("woff2");
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "thmanyah Sans";
  src: url("/fonts/thmanyahsans-Regular.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "thmanyah Serif Text";
  src: url("/fonts/thmanyahseriftext-Regular.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

:root {
  --font-display: "thmanyah Serif Display", Georgia, "Noto Naskh Arabic", "Geeza Pro", serif;
  --font-text: "thmanyah Serif Text", Georgia, "Noto Naskh Arabic", "Geeza Pro", serif;
  --font-ui: "thmanyah Sans", system-ui, "Segoe UI", "Noto Sans Arabic", "Geeza Pro", sans-serif;

  --fw-display: 700;
  --fw-text: 400;
  --fw-ui: 400;

  --fs-display: clamp(2.5rem, 1.35rem + 4.6vw, 4.75rem);   /* 40 → 76 px */
  --fs-title: clamp(1.875rem, 1.3rem + 2.2vw, 3rem);       /* 30 → 48 px */
  --fs-folder-num: clamp(1.75rem, 1.2rem + 1.6vw, 2.5rem); /* 28 → 40 px */
  --fs-folder-title: 1.25rem;                               /* 20 px */
  --fs-lead: clamp(1.0625rem, 1rem + 0.3vw, 1.25rem);       /* 17 → 20 px */
  --fs-story: 1.125rem;                                     /* 18 px */
  --fs-ui: 0.9375rem;                                       /* 15 px */
  --fs-meta: 0.8125rem;                                     /* 13 px */
  --fs-kicker: 0.75rem;                                     /* 12 px */

  --lh-display: 1.02;
  --lh-title: 1.08;
  --lh-lead: 1.6;
  --lh-story: 1.65;
  --lh-ui: 1.5;

  --ls-display: -0.02em;
  --ls-title: -0.01em;
  --ls-kicker: 0.26em;
}

:root:lang(ar) {
  --fs-story: 1.1875rem;       /* 19 px */
  --fs-ui: 1rem;               /* 16 px */
  --fs-meta: 0.875rem;         /* 14 px */
  --fs-kicker: 0.9375rem;      /* 15 px */
  --lh-display: 1.3;
  --lh-title: 1.35;
  --lh-lead: 1.85;
  --lh-story: 1.95;
  --lh-ui: 1.7;
  --ls-display: 0;
  --ls-title: 0;
  --ls-kicker: 0;
}

html {
  font-family: var(--font-ui);
  font-weight: var(--fw-ui);
  font-synthesis: none;        /* one weight per family: never fake bold or italic */
  text-size-adjust: 100%;
  -webkit-font-smoothing: antialiased;
}
```

| Role | Font | Size EN / AR | Weight | Line height EN / AR | Tracking EN |
|---|---|---|---|---|---|
| Display H1 (home hero) | Serif Display | `--fs-display` / same | 700 | 1.02 / 1.3 | -0.02em |
| File title H2 | Serif Display | `--fs-title` / same | 700 | 1.08 / 1.35 | -0.01em |
| Folder number | Serif Display | `--fs-folder-num` | 700 | 1 | 0 |
| Folder title H3 | Serif Display | 20 px | 700 | 1.2 / 1.45 | 0 |
| Lead | Sans | `--fs-lead` | 400 | 1.6 / 1.85 | 0 |
| Story body | Serif Text | 18 / 19 px | 400 | 1.65 / 1.95 | 0 |
| UI, buttons, body | Sans | 15 / 16 px | 400 | 1.5 / 1.7 | 0 |
| Meta, captions | Sans | 13 / 14 px | 400 | 1.5 / 1.7 | 0.01em |
| Kicker, story labels, tags | Sans, uppercase in EN | 12 / 15 px | 400 | 1.4 | 0.26em |

**Typography rules**

- Hierarchy comes from family, size, color, case and space. Never from weight: each family has one weight.
- Headings (H1, H2, H3) and the folder tabs (number and name, owner's choice 2026-10-13) always use Serif Display. The project story (context, what I did, result) always uses Serif Text. Everything else uses Sans.
- Story measure: 34 to 40 em in EN, 30 to 36 em in AR. Lead measure: 46 ch max.
- Arabic never gets letter-spacing, uppercase or italic. Arabic UI digits are Arabic-Indic (٠١٢٣), including folder numbers (١-).
- Digits are proportional (no `tnum`). Number columns in demos sit in fixed-width cells aligned to `end`.
- Swash letters and the slanted kashida are off. The prototype tests one Arabic display word on the home H1 with the font's alternates; it stays only if the owner approves it in the prototype.
- `text-wrap: balance` on H1, H2 and folder titles. `text-wrap: pretty` on lead and story.
- **Never use**: any other family (Inter, Roboto, IBM Plex, system UI as a design choice), a second weight of any thmanyah family, synthetic bold, italics, all-caps Arabic, justified Arabic with stretched spaces.

**Text decoration** (decision table in the `web-design` references, style "warm editorial"):

- Display H1: no gradient, no shadow. On night it is paper-colored and clean.
- File title H2: no gradient, no shadow.
- Body and story: never decorated.
- Kickers and story labels: no underline; a 1 px hairline above the story block does that job.

---

## 4. Component Stylings

All components use logical properties, so they mirror in Arabic without extra rules.

### Base and focus

```css
*, *::before, *::after { box-sizing: border-box; }

body {
  margin: 0;
  min-block-size: 100dvh;
  color: var(--c-paper);
  background-color: var(--c-night);
  background-image:
    radial-gradient(ellipse 70% 55% at 50% -8%, rgb(var(--c-lamp-rgb) / 0.08), transparent 70%),
    linear-gradient(180deg, var(--c-night-3) 0%, var(--c-night) 55%);
  background-repeat: no-repeat;
  font-size: var(--fs-ui);
  line-height: var(--lh-ui);
}

:where(a, button, summary, [tabindex]):focus-visible {
  outline: 3px solid var(--focus);
  outline-offset: 2px;
  border-radius: 4px;
}

.sr-only {
  position: absolute; inline-size: 1px; block-size: 1px;
  margin: -1px; padding: 0; overflow: hidden;
  clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}
```

### Buttons

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--s-2);
  min-block-size: var(--tap);
  min-inline-size: var(--tap);
  padding-inline: var(--s-5);
  border: 1px solid var(--c-line-3);
  border-radius: var(--r-btn);
  background: transparent;
  color: var(--c-paper);
  font: var(--fw-ui) var(--fs-ui) / 1 var(--font-ui);
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
  transition:
    background-color 200ms var(--ease-paper),
    border-color 200ms var(--ease-paper),
    color 200ms var(--ease-paper),
    scale var(--d-press) var(--ease-paper);
}
@media (hover: hover) {
  .btn:hover { border-color: var(--c-mist); background-color: rgb(var(--c-paper-rgb) / 0.06); }
}
.btn:active { scale: 0.98; }
.btn:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
.btn:disabled,
.btn[aria-disabled="true"] {
  opacity: 0.45;
  cursor: not-allowed;
  background-color: transparent;
  border-color: var(--c-line-3);
  scale: 1;
}

/* Primary on night: a sheet of paper */
.btn--primary {
  background-color: var(--c-paper);
  border-color: var(--c-paper);
  color: var(--c-ink);
}
.btn--primary:hover { background-color: var(--c-paper-hi); border-color: var(--c-paper-hi); }
.btn--primary:disabled,
.btn--primary[aria-disabled="true"] { background-color: var(--c-paper); border-color: var(--c-paper); }

/* On paper */
.on-paper .btn, .btn.on-paper { border-color: var(--c-ink-muted); color: var(--c-ink); }
.on-paper .btn:hover { border-color: var(--c-ink); background-color: rgb(var(--c-ink-rgb) / 0.05); }
.on-paper .btn--primary { background-color: var(--c-ink); border-color: var(--c-ink); color: var(--c-paper); }
.on-paper .btn--primary:hover { background-color: var(--c-ink-2); border-color: var(--c-ink-2); }

/* Icon inside a button */
.btn__icon { inline-size: 18px; block-size: 18px; flex: none; }
[dir="rtl"] .btn__icon--directional { scale: -1 1; }
```

### Drawer and folders (the card of this site)

The drawer is an open box seen from the front and a little above. Layers, back to front: the dark back wall, the folders, a depth shade, the side walls, the drawer front. Only the folder tabs rise above the rim; each folder's side edges disappear behind the walls. Back folders sit further inside the box than front folders, so the drawer reads in depth. The phone uses the same drawer, larger (section 9).

A folder is a `<li>` with a real `<button>` tab. Clicking anywhere on the folder face forwards to the tab (one delegated listener); only the tab is focusable. The folder edges carry no text: the tab holds the number and short title, and the tabs climb across the drawer in a staircase. The full title and summary stay in the DOM, visually hidden, and are linked to the tab with `aria-describedby`. On hover or focus, the drawer front captions the folder.

```css
.drawer__cabinet {
  /* Design A (owner's choice): a wider step, taller tabs, more paper at the front */
  --step: 58px;                  /* vertical offset between folders */
  --tab-w: clamp(230px, 21%, 270px);     /* wide enough for the longest short title with Latin digits */
  --visible-front: 120px;        /* the front folder shows the most paper */
  --wall-front: 30px;            /* side wall thickness at the front */
  --wall-back: 8px;              /* side wall thickness at the back */
  --inset-back: 52px;            /* how far the back of the box sits inside the front, per side */
  --rim: 16px;                   /* back wall showing above the backmost folder */
  --tab-pad: 14px;               /* tabs keep off the folder corners, so every tab sits on a straight edge */
  --stack-top: 78px;             /* room for the first tab (56 px) and its lift */
  position: relative;
  block-size: calc(var(--stack-top) + 5 * var(--step) + var(--visible-front));
}
.drawer__back {
  position: absolute; z-index: 0;
  inset-inline: calc(var(--inset-back) - var(--wall-back) - 2px);
  inset-block: calc(64px - var(--rim)) 0;
  border-radius: 10px 10px 0 0;
  background: linear-gradient(180deg, var(--c-drawer-handle), var(--c-night) 70%);
  box-shadow: inset 0 2px 0 var(--c-drawer-edge);
}
.drawer__stack {
  position: absolute; z-index: 1; inset: 0;
  display: grid; grid-template-areas: "stack";
  margin: 0; padding: 64px 0 0; list-style: none;
  clip-path: inset(-400px 0 18px 0);       /* folder bottoms end behind the drawer front */
}
.drawer__depth {
  position: absolute; z-index: 2; inset: 0; pointer-events: none;
  background: linear-gradient(180deg, transparent 72%, rgb(var(--c-night-rgb) / 0.22) 100%);
}
.drawer__walls { position: absolute; z-index: 3; inset: 0; pointer-events: none; }
.drawer__walls::before, .drawer__walls::after {
  content: ""; position: absolute; inset-block: calc(64px - var(--rim)) 0; inline-size: var(--inset-back);
}
/* Physical sides on purpose: the box is symmetric, so RTL needs no mirroring */
.drawer__walls::before {
  left: 0;
  background: linear-gradient(90deg, var(--c-drawer) 30%, var(--c-drawer-edge));
  clip-path: polygon(0 100%, 0 calc(100% - var(--visible-front) - 18px), calc(100% - var(--wall-back)) 0, 100% 0, var(--wall-front) 100%);
}
.drawer__walls::after {
  right: 0;
  background: linear-gradient(270deg, var(--c-drawer) 30%, var(--c-drawer-edge));
  clip-path: polygon(100% 100%, 100% calc(100% - var(--visible-front) - 18px), var(--wall-back) 0, 0 0, calc(100% - var(--wall-front)) 100%);
}

.folder {
  --lift: 0px;
  grid-area: stack;
  position: relative;
  z-index: calc(var(--z-folder) + var(--i));
  /* back folders sit further inside the box, front folders closer to the walls */
  margin-inline: calc(var(--inset-back) + 4px - var(--i) * (var(--inset-back) - var(--wall-front)) / 5);
  translate: 0 calc(var(--i) * var(--step) - var(--lift));
  transition: translate var(--d-hover) var(--ease-paper);
}
.folder__sheet {
  position: relative;
  min-block-size: 400px;
  padding: 10px var(--s-6) var(--s-8);
  border-radius: 14px;
  background: var(--tone);
  color: var(--c-ink);
  box-shadow: var(--sh-folder);
  cursor: pointer;
}
.folder__tab {
  position: absolute;
  inset-block-end: calc(100% - 1px);
  inset-inline-start: calc(var(--tab-pad) + var(--slot) * (100% - var(--tab-w) - 2 * var(--tab-pad)) / 5);
  inline-size: var(--tab-w);
  min-block-size: 56px;
  display: flex;
  align-items: center;
  gap: var(--s-3);
  padding: 10px 18px 4px;
  border: 0;
  border-radius: var(--r-tab);
  background: var(--tone);
  color: var(--c-ink);
  font: var(--fw-ui) 1rem / 1.2 var(--font-ui);
  text-align: start;
  cursor: pointer;
  transition: scale var(--d-press) var(--ease-paper);
}
.folder__num { font: var(--fw-display) 1.875rem / 1 var(--font-display); }   /* phone 1.75rem, under 390 px 1.5rem */
.folder__short { font: var(--fw-display) 1.125rem / 1.2 var(--font-display); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }   /* phone 1.3125rem, under 390 px 1.1875rem */
.folder__lock { display: none; inline-size: 16px; block-size: 16px; flex: none; align-self: center; color: var(--c-stamp); }

@media (hover: hover) {
  .drawer:not([data-open]) .folder:hover { --lift: var(--m-hover-lift); }
}
.drawer:not([data-open]) .folder:has(.folder__tab:focus-visible) { --lift: var(--m-hover-lift); }
.folder__tab:focus-visible { outline: 3px solid var(--c-signal); outline-offset: 2px; }
.folder__tab:active { scale: 0.98; }

/* Locked folder (not in the MVP): tab has aria-disabled="true"; the stamp sits in its band, under its own tab */
.folder[data-locked] .folder__sheet,
.folder[data-locked] .folder__tab { cursor: not-allowed; }
.folder[data-locked] .stamp {
  position: absolute;
  inset-block-start: 8px;
  inset-inline-start: calc(var(--tab-pad) + var(--slot) * (100% - var(--tab-w) - 2 * var(--tab-pad)) / 5 + var(--s-4));
}
```

### Drawer front

The drawer front is a caption plate. At rest it shows the label card and the hint. When a folder is hovered or its tab focused, the hint is replaced by that folder's title (Serif Display) and summary (or "Coming soon" for a locked folder). The caption is `aria-hidden="true"`: screen readers get the same text from the tab's description.

```css
.drawer__front {
  position: relative;
  z-index: var(--z-drawer);
  margin-block-start: -18px;                 /* overlaps the clipped bottom of the stack */
  min-block-size: 144px;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: var(--s-3);
  border-radius: 8px 8px var(--r-drawer) var(--r-drawer);
  background: linear-gradient(180deg, var(--c-drawer-edge) 0, var(--c-drawer) 6px);
  box-shadow: var(--sh-drawer);
}
.drawer__label {                             /* the cream card in a label holder */
  padding: var(--s-2) var(--s-5);
  border: 2px solid var(--c-drawer-edge);
  border-radius: 6px;
  background: var(--c-paper);
  color: var(--c-ink);
  font: var(--fw-ui) var(--fs-kicker) / 1.4 var(--font-ui);
  letter-spacing: var(--ls-kicker);
  text-transform: uppercase;
}
.drawer__handle {
  inline-size: 120px;
  block-size: 12px;
  border-radius: var(--r-pill);
  background: var(--c-drawer-handle);
  box-shadow: inset 0 1px 0 rgb(var(--c-paper-rgb) / 0.08);
}
.drawer__hint { margin: 0; color: var(--c-mist); font-size: var(--fs-meta); }
.drawer__caption { display: grid; justify-items: center; gap: 2px; min-block-size: 3.4em; text-align: center; padding-inline: var(--s-5); }
.drawer__caption[hidden] { display: none; }
.drawer__caption-title { margin: 0; color: var(--c-paper); font: var(--fw-display) 1.125rem / 1.45 var(--font-display); }
.drawer__caption-text { margin: 0; color: var(--c-mist); font-size: var(--fs-meta); }
```

### Closed drawer (the visitor opens it)

Approved by the owner on 2026-10-01 from the `pull` and `sound` variants in `design/prototype/home/`. The drawer starts closed in its cabinet every time the home page loads, including reloads, the language switch and the way back from a project page, and the visitor opens it (owner's rule, 2026-10-13). Opening a file and closing it again happens on the open drawer. Without JavaScript it is open. A one-time `drawer-open` flag in `sessionStorage` lands on the open drawer instead; nothing on the site sets it, the tests do.

- **Closed**: the drawer front sits right under the title, tucked under the cabinet's top edge (a 9 px metal lip). Below it, more drawers down to the bottom edge, each a front with an empty label holder and a metal pull, dimmer further from the lamp. The folders are inside, out of sight and out of reach (`visibility: hidden`, then `inert`). The lamp is off.
- **The front is the button**: a transparent `<button>` over the whole front, labelled "Open the project drawer" (`aria-controls` the stack, `aria-expanded`). The hint reads "Press to open the drawer". Pressed, the front gives a little (scale 0.992) and the pull drops 2 px. On hover the pull glows with lamp light. Now and then the closed front gives a small tug (section 7).
- **Opened**: the drawer is pulled out (section 7, The drawer pull). The box comes out from under the top edge, front end first and back wall last, with the lip's shadow falling into it, and covers the drawers below. At the stop the lamp comes on and the cabinet around the drawer fades away, leaving the open design above. Focus moves to the first folder tab.
- `index.astro` puts `.drawer-closed` and `.drawer-cased` on `<html>` before the first paint, so there is no flash and nothing is measured: while closed the front simply comes first in the drawer's column. `pull.ts` takes the classes off. States: `.drawer-closed` (front first, box hidden), `.drawer-pulling` (the travel), `.drawer-lit` (lamp on, cabinet fading), `.drawer-cased` (the cabinet around the drawer is shown).
- New shades are mixed from the tokens (`--c-drawer`, `--c-drawer-edge`, `--c-mist`, `--c-mist-2`, `--c-night`), as for the metal front.

### Open file (a full page)

Opening a project replaces the view: a page of paper covers the whole screen, so the colour changes from night to paper as if you had entered a new page (owner's decision). It is a native `<dialog>` opened with `showModal()`, sized to the viewport, and it scrolls on its own; the page behind is locked.

```css
.file-dialog {
  position: fixed; inset: 0;
  inline-size: 100vw; block-size: 100dvh; max-inline-size: none; max-block-size: none;
  margin: 0; padding: 0; border: 0; background: transparent;
  overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain;
}
.file-dialog::backdrop { background: transparent; }
html:has(dialog[open]) { overflow: hidden; }

.leaf { position: relative; min-block-size: 100dvh; background: var(--c-paper); color: var(--c-ink); }
.leaf__bar {
  position: sticky; inset-block-start: 0; z-index: 3;
  background: var(--c-paper);
  border-block-end: 1px solid var(--c-paper-line);
}
.leaf__bar-inner { display: flex; align-items: center; justify-content: space-between; gap: var(--s-4); min-block-size: 72px; }
.leaf__folio { margin: 0; color: var(--c-ink-muted); font-size: var(--fs-meta); }

/* The spread (owner's choice, layout A in design/prototype/leaf-view.html): tag, title and summary beside
   a larger film, the demo and download at the foot of that column, then the story across the page.
   In the DOM the story comes before the actions, so it is read first. */
.leaf__body {
  display: grid;
  grid-template-columns: 5fr 7fr;
  grid-template-rows: auto 1fr auto;
  grid-template-areas: "head film" "act film" "story story";
  column-gap: clamp(40px, 5vw, 88px);
  padding-block: clamp(40px, 4.5vw, 64px) clamp(48px, 5vw, 80px);
}
.file__head { grid-area: head; }
.file__film { grid-area: film; }
.file__act { grid-area: act; align-self: end; padding-block-start: var(--s-6); }
.file__lead { max-inline-size: 30em; margin: 0; color: var(--c-ink-2); font: var(--fw-ui) var(--fs-lead) / 1.6 var(--font-ui); }

.file__tag {
  margin: 0 0 var(--s-3);
  color: var(--c-teal);
  font: var(--fw-ui) var(--fs-kicker) / 1.4 var(--font-ui);
  letter-spacing: var(--ls-kicker);
  text-transform: uppercase;
}
.file__title {
  margin: 0 0 var(--s-6);
  max-inline-size: 14ch;
  font: var(--fw-display) clamp(2.25rem, 1.4rem + 3vw, 4rem) / var(--lh-title) var(--font-display);
  letter-spacing: var(--ls-title);
  text-wrap: balance;
}
.file__title:focus { outline: none; }                          /* receives focus by script after opening */
.file__title:focus-visible { outline: 3px solid var(--focus); outline-offset: 4px; }

/* Three columns under an ink rule, split by hairlines */
.story { grid-area: story; display: grid; grid-template-columns: repeat(3, 1fr); margin-block-start: clamp(48px, 5vw, 72px); border-block-start: 1px solid var(--c-ink); }
.story__block { padding: var(--s-5) clamp(20px, 2.4vw, 40px) 0; border-inline-start: 1px solid var(--c-paper-line); }
.story__block:first-child { padding-inline-start: 0; border-inline-start: 0; }
.story__block:last-child { padding-inline-end: 0; }
.story__label {
  margin: 0 0 var(--s-2);
  color: var(--c-ink-muted);
  font: var(--fw-ui) var(--fs-kicker) / 1.4 var(--font-ui);
  letter-spacing: var(--ls-kicker);
  text-transform: uppercase;
}
.story__text {
  margin: 0;
  max-inline-size: 34em;
  color: var(--c-ink-2);
  font: var(--fw-text) var(--fs-story) / var(--lh-story) var(--font-text);
  text-wrap: pretty;
}
.file__actions { display: flex; flex-wrap: wrap; gap: var(--s-3); }
.file__nav {
  display: flex;
  justify-content: space-between;
  gap: var(--s-3);
  padding-block: var(--s-5) var(--s-8);
  border-block-start: 1px solid var(--c-paper-line);
}
```

### Film frame

```css
.film {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 12px;
  background: var(--c-film);
}
.film video, .film img { inline-size: 100%; block-size: 100%; object-fit: cover; display: block; }
.film__play {
  position: absolute;
  inset: 0;
  margin: auto;
  inline-size: 64px;
  block-size: 64px;
  border: 0;
  border-radius: 50%;
  background: var(--c-paper);
  color: var(--c-ink);
  cursor: pointer;
  transition: scale var(--d-press) var(--ease-paper), background-color 200ms var(--ease-paper);
}
.film__play:hover { background: var(--c-paper-hi); }
.film__play:active { scale: 0.96; }
.film__play:focus-visible { outline: 3px solid var(--c-signal); outline-offset: 3px; }
/* The film as text: a <details> under the frame, listing each scene's on-screen lines */
.film__text { margin-block-start: var(--s-3); color: var(--c-ink-muted); font-size: var(--fs-meta); }
.film__text summary { min-block-size: var(--tap); text-decoration: underline; }   /* reads as a link */
.film__scenes { display: grid; gap: var(--s-3); color: var(--c-ink-2); font-size: var(--fs-ui); }
```

### Links

```css
.link {
  color: inherit;
  text-decoration-line: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.25em;
  text-decoration-color: color-mix(in srgb, currentColor 40%, transparent);
  transition: text-decoration-color 200ms var(--ease-paper), text-underline-offset 200ms var(--ease-paper);
}
.link:hover { text-decoration-color: currentColor; text-underline-offset: 0.35em; }
.link:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; border-radius: 2px; }
```

### Tags, stamp and badges

```css
.kicker {
  margin: 0 0 var(--s-3);
  color: var(--c-signal);
  font: var(--fw-ui) var(--fs-kicker) / 1.4 var(--font-ui);
  letter-spacing: var(--ls-kicker);
  text-transform: uppercase;
}
:lang(ar) .kicker, :lang(ar) .file__tag, :lang(ar) .story__label, :lang(ar) .drawer__label { text-transform: none; }

/* Ink stamp: "Sample data" and "Coming soon" */
.stamp {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border: 1.5px solid currentColor;
  border-radius: 6px;
  color: var(--c-stamp);
  font: var(--fw-ui) var(--fs-kicker) / 1.2 var(--font-ui);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  rotate: -3deg;
  mix-blend-mode: multiply;
  user-select: none;
}
:lang(ar) .stamp { letter-spacing: 0; text-transform: none; font-size: var(--fs-meta); }
[dir="rtl"] .stamp { rotate: 3deg; }
```

The demo stamp is always visible and is never covered, hidden or animated out.

### Masthead and language switch

```css
.masthead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-4);
  padding-block: var(--s-5);
}
.byline__name { margin: 0; font: var(--fw-display) 1.125rem / 1.2 var(--font-display); }
.byline__role { margin: 0; color: var(--c-mist-2); font-size: var(--fs-meta); }
.masthead__nav { display: flex; align-items: center; gap: var(--s-2); }

.lang-switch { min-inline-size: var(--tap); padding-inline: var(--s-4); }
.lang-switch:lang(en) { letter-spacing: 0.08em; }
```

The masthead is not sticky. The language switch is a link (`<a hreflang lang>`) to the same page in the other language. On the home page the sound switch follows it on wide screens (section 7, Sound); on phones the masthead has no room, so it sits at the end of the kicker line.

### Downloads

```css
.download {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  min-block-size: var(--tap);
  padding-block: var(--s-2);
  color: var(--c-ink);
  text-decoration: none;
  border-block-end: 1px solid var(--c-paper-line);
}
.download__kind { color: var(--c-ink-muted); font-size: var(--fs-meta); letter-spacing: 0.08em; }
.download__icon { inline-size: 18px; block-size: 18px; transition: translate 200ms var(--ease-paper); }
.download:hover .download__icon { translate: 0 3px; }
.download:hover .download__label { text-decoration: underline; text-underline-offset: 0.25em; }
.download:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
```

### Closing card (footer)

Used at the end of project and demo pages. Not on the home page, where the masthead's card link is enough (owner's decision).

```css
.closing {
  display: grid;
  gap: var(--s-4);
  justify-items: start;
  padding: var(--s-7);
  border: 1px solid var(--c-line-2);
  border-radius: var(--r-drawer);
  background: var(--c-night-2);
}
.closing__line { margin: 0; color: var(--c-mist); }
.closing__note { margin: 0; color: var(--c-mist-2); font-size: var(--fs-meta); }
```

### Demo sheet and data display

```css
.demo-sheet {
  position: relative;
  padding: clamp(24px, 4vw, 48px);
  border-radius: 18px;
  border-start-start-radius: 0;
  background: var(--c-paper);
  color: var(--c-ink);
  box-shadow: var(--sh-file);
}
.demo-sheet > .stamp { position: absolute; inset-block-start: var(--s-5); inset-inline-end: var(--s-5); }

.stat { display: grid; gap: var(--s-1); padding-block-start: var(--s-3); border-block-start: 1px solid var(--c-paper-line); }
.stat__value { font: var(--fw-display) var(--fs-title) / 1 var(--font-display); }
.stat__label { color: var(--c-ink-muted); font-size: var(--fs-meta); }

.status { display: inline-flex; align-items: center; gap: 6px; font-size: var(--fs-meta); }
.status::before { content: ""; inline-size: 8px; block-size: 8px; border-radius: 50%; background: currentColor; }
.status--ok { color: var(--c-ok); }
.status--warn { color: var(--c-warn); }
.status--gap { color: var(--c-gap); }
```

Charts are hand-built SVG in ink on paper: 1 px `--c-paper-line` gridlines, bars in `--c-ink-2`, one highlighted series in `--c-teal`, direct labels instead of legends where possible, round sample numbers, and the stamp on the sheet.

The live frame (`LiveFile.astro`) holds the project's own file: 1 px `--c-paper-line` border, 12 px radius, `--c-paper-hi` behind it. Its shape follows the kind: a report 16:9.4, a workbook 4:3 (3:4 on phones), a document 3:4 up to 820 px wide, never taller than 85svh. Until opened it shows faint ruled lines, the primary button "Open the live file" and one line saying where it loads from. The file keeps its own design inside the frame; the chart rules above apply to anything drawn by the site itself.

### Icons and imagery

- Icons are inline SVG on a 20 px grid, 1.5 px stroke, round caps and joins, `currentColor`. Set: arrow, download, play, close, external, lock, chevron. Directional icons mirror in RTL.
- No photos, no stock images, no emoji. The only imagery is film posters and loops made for this site.

---

## 5. Layout Principles

**Container**

- Max width: 1240 px, centered with `margin-inline: auto`.
- Side padding: `--gutter: clamp(16px, 5vw, 80px)`.
- Narrow text column: 38 em (story), 46 ch (lead).

**Spacing scale** (unchanged tokens): 4, 8, 12, 16, 24, 32, 44, 64, 80 px as `--s-1` to `--s-9`.

- Section spacing: `clamp(64px, 8vw, 128px)` between the drawer and the closing card.
- Component gap: `--s-5` inside groups, `--s-7` between groups.
- Folder face padding: `--s-5` / `--s-6`. File page padding: `clamp(24px, 4vw, 56px)`.

**Grid**

```css
.container { inline-size: min(100%, 1240px); margin-inline: auto; padding-inline: var(--gutter); }

.grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  column-gap: clamp(16px, 2vw, 32px);
}
/* Design A: the kicker on its own row, then the title and the lead side by side */
.hero__grid { align-items: end; }
.hero__kicker { grid-column: 1 / -1; }
.hero__title { grid-column: 1 / span 7; margin: 0; font-size: var(--fs-hero); }   /* 40 → 64 px */
.hero__lead { grid-column: 8 / span 5; }

@media (max-width: 899px) {
  .grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .hero__kicker, .hero__title, .hero__lead { grid-column: 1 / -1; }
}
```

**First view on desktop (1440 × 900)**: masthead ≈ 90 px, hero ≈ 300 px (`padding-block: clamp(24px, 4vw, 48px) 24px`), drawer ≈ 460 px. Measured in the prototype: the drawer front ends at 869 px, so the whole drawer and every tab are visible without scrolling.

**Editorial rules**

- Left-heavy (inline-start) composition. Nothing is centered except the drawer label and the handle.
- Hairlines separate, boxes do not: no cards inside cards, no bordered panels on paper.
- Folder numbers (`1-`, `١-`, owner's choice) are the only large numerals on the site. They count files, never entity data.

---

## 6. Depth & Elevation

| Level | Treatment | Use |
|---|---|---|
| Flat | none | text, hairlines, anything on the same sheet |
| Paper edge | `0 1px 0 rgb(var(--c-paper-rgb) / 0.08) inset` | drawer handle, drawer front top edge |
| Folder | `--sh-folder: 0 -12px 28px rgb(0 0 0 / 0.35)` | folders standing in the drawer (shadow falls upward, onto the folder behind) |
| Drawer | `--sh-drawer: 0 -18px 40px rgb(0 0 0 / 0.45)` | drawer front |
| Drawer interior | back wall `linear-gradient(180deg, --c-drawer-handle, --c-night 70%)`, depth shade `rgb(var(--c-night-rgb) / 0.22)` at the bottom | inside of the drawer box |
| File | `--sh-file: 0 30px 70px rgb(0 0 0 / 0.55)` | demo sheet |
| Spine | 1 px `--c-paper-line` | between the two columns of the open file |

Z order: `--z-folder: 1` (plus index), `--z-drawer: 12`, `--z-folder-active: 20`, `--z-file: 40`, `--z-toast: 60`.

Shadows are never animated. A lifted folder moves; its shadow moves with it.

---

## 7. Animation & Interaction

**Motion philosophy**: paper, not pixels. Things slide, lift and settle like light card. One thing moves at a time, and only `transform`, `opacity` and `filter: brightness()` animate.
**Tier**: L2, plus the page pull as the one signature moment. The full sequence tables are in `design/MOTION.md`, regenerated from this section.

The `web-design` skill's "signature motion" quota (six effect types, animated backgrounds, text effects on every heading) does not apply here: `CLAUDE.md` limits that skill to the spec phases, and the brief asks for medium motion.

### Tokens

```css
:root {
  --ease-paper: cubic-bezier(0.2, 0.7, 0.2, 1);     /* paper sliding to rest */
  --ease-in: cubic-bezier(0.4, 0, 0.8, 0.3);        /* leaving: the page slides back down */
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-settle: cubic-bezier(0.3, 1.35, 0.5, 1);   /* small overshoot for a lifted folder */

  --d-press: 120ms;
  --d-hover: 350ms;
  --d-nudge: 160ms;          /* the picked folder nudges up as the page starts */
  --d-page-in: 720ms;        /* the page is pulled up over the cabinet */
  --d-page-out: 500ms;       /* the page slides back down */
  --d-content: 450ms;
  --d-stagger: 70ms;
  --d-enter: 800ms;
  --d-enter-stagger: 90ms;
  --d-fade: 150ms;
  --d-stamp: 260ms;

  --m-hover-lift: 16px;
  --m-nudge: 14px;
  --m-rise: 14px;
}
```

### Dependencies

```
npm i gsap
```

GSAP core and `CustomEase` are the only motion libraries. Implementation details follow the `gsap-*` skills.

### Base setup

```js
import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(CustomEase);
CustomEase.create("paper", "0.2,0.7,0.2,1");
CustomEase.create("settle", "0.3,1.35,0.5,1");
CustomEase.create("paperIn", "0.4,0,0.8,0.3");
CustomEase.create("paperInOut", "0.65,0,0.35,1");

export const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
```

### Entrance (first load of home, once per session)

```css
@keyframes rise {
  from { opacity: 0; translate: 0 var(--rise, var(--m-rise)); }
  to { opacity: 1; translate: 0 0; }
}
.is-entering .hero__kicker,
.is-entering .hero__title,
.is-entering .hero__lead {
  animation: rise 700ms var(--ease-paper) backwards;
}
.is-entering .hero__title { animation-delay: 100ms; }
.is-entering .hero__lead { animation-delay: 200ms; }
/* The closed cabinet slides into view below the title */
@keyframes drawer-out {
  from { opacity: 0; transform: translateY(56px) scale(0.965); }
}
.is-entering .drawer { animation: drawer-out 850ms var(--ease-paper) 80ms backwards; }
```

`is-entering` is set on `<html>` by an inline script only when `sessionStorage` has no `entered` flag. It is never set when coming back from a project page. That first view always shows the drawer closed, so the folders no longer rise in: they come out with the drawer (The drawer pull).

### The drawer pull (first visit)

Pressing the closed front pulls the drawer out like a real one. The motion is worked out from simple physics in `src/components/cabinet/pull.ts` and sampled at 120 steps a second into Web Animations keyframes (transform only, nothing measured while it runs):

| Part | Motion |
|---|---|
| The pull | The front and the box travel together from the closed place to the open one. A cubic from rest: a heavy start, full speed in the middle, and still moving (0.6 × the average speed) when it reaches the stop. It takes 0.72 to 0.92 s, a little longer for a longer drawer. |
| The stop | A stiff rubber bumper (about 5.5 swings a second, damping 0.42): the drawer gives about 7 px and rebounds about 2 px, settled in 0.45 s. |
| The folders | They hang on rails: each is a pendulum (2.2 swings a second at the back up to 3.3 at the front, damping 0.26) pushed by the drawer's acceleration. They lag as it sets off, swing forward at the stop and settle within a second; held to −9 … 12 px. |
| The lamp | Comes on 60 ms after the stop, over 900 ms. The lip, its shadow and the drawers below fade out after it. |
| The tug | While closed, every 3.2 s from 0.9 s, the front moves 7 px towards you, back to 1, out to 4 and home. A tug in progress carries into the pull. |

With reduced motion there is no travel and no tug: the open drawer fades in (150 ms).

### Sound

Owner's decision: the drawer has sounds, **off until the visitor turns them on**. A square switch with a speaker icon (`SoundSwitch.astro`, `aria-pressed`, labelled "Drawer sounds") sits by the language switch on wide screens and at the end of the kicker line on phones. The choice is kept in this browser (`localStorage`). The switch shows only where the browser can play sound.

| Moment | Sound |
|---|---|
| The drawer pulled open | The latch lets go, the drawer rolls out on ball-bearing rails (the roll follows the pull's speed, a bearing ticks every few millimetres), hits its stop with a thud and a ring of metal, rebounds, and the hanging folders settle with a rustle. |
| A folder picked out (mouse over it, or keyboard focus) | A short flick of paper, a little higher for each folder forward, in three slightly different takes, at most one every 70 ms. Touch has no hover, so phones hear the next two only. |
| A folder opened | A tap on the tab, then a swish that follows the page as it is pulled up. |
| A locked folder | Two muted knocks, with the "Coming soon" note. |

- Every sound is drawn in code, sample by sample (`src/components/cabinet/synth.ts`, Web Audio): no audio files to load or license. A small room reverb and a limiter sit on the output. The code (about 2.5 KB gzipped) loads only once sound is on.
- Browsers allow sound only after a press, so the audio starts inside one: the switch, or, after a visit that left sound on, the first press on the page.
- Levels: the stop peaks near −6 dBFS, the roll around −30 dB, the flick near −20 dBFS. The overtones of the low sounds carry them on phone speakers.


### Scroll behavior

No scroll-linked motion. Blocks below the first view rise once when they enter the viewport.

```js
const io = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    entry.target.classList.add("is-in");
    io.unobserve(entry.target);
  }
}, { rootMargin: "0px 0px -10% 0px" });

document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
```

```css
[data-reveal] { opacity: 0; translate: 0 var(--m-rise); transition: opacity var(--d-content) var(--ease-paper), translate var(--d-content) var(--ease-paper); }
[data-reveal].is-in { opacity: 1; translate: 0 0; }
```

### Hover and focus states

| Element | Hover (pointer devices only) | Focus-visible | Press |
|---|---|---|---|
| Folder | lifts 16 px, 350 ms paper ease | same lift plus the ring on the tab | tab scales to 0.98 |
| Button | border and background shift, 200 ms | 3 px ring, 2 px offset | scale 0.98 |
| Link | underline darkens and drops 0.1 em | ring | none |
| Download | arrow nudges 3 px down | ring | none |
| Play | background lightens | ring, 3 px offset | scale 0.96 |

Hover effects live inside `@media (hover: hover)` so touch devices never get stuck states.

### The pull (signature moment)

Approved by the owner in the prototype (style 1, "page pulled up"). Reference implementation: `design/prototype/cabinet.js`, `STYLES[1]`, `openFile`, `closeFile`. Styles 2 and 3 in the prototype were alternatives for comparison and are not part of the design.

**Open** (≈ 1.3 s; the title takes focus at 0.82 s):

| t (ms) | What happens |
|---|---|
| 0 | Tab pressed. The dialog opens with the page placed just below the screen (`y = 100vh`). Content blocks are hidden 14 px low. |
| 0 → 160 | The picked folder nudges up `--m-nudge` (14 px), `--ease-paper`. |
| 160 → 460 | It settles back into the drawer. |
| 100 → 820 | The page is pulled up to `y = 0` over the cabinet, `--d-page-in`, `--ease-paper`. The screen turns from night to paper. |
| 500 → 1300 | Content rises in, `--d-content` each, `--d-stagger` apart: tag, title, summary, film, demo and download, the three story blocks, previous / next. |
| 820 | Focus moves to the file title. |

**Close** (500 ms): the page slides back down below the screen, `--d-page-out`, `--ease-in`, with its content in place. Then the dialog closes and focus returns to the tab. Triggers: the close button, `Esc`, browser back and the Android back gesture (opening pushes a history entry). The dialog is scrolled to the top first.

**Rules**

- Transforms and opacity only. The page moves with `y`; nothing reads layout inside the animation.
- A close requested while the page is opening, or while previous / next is swapping content, runs as soon as that finishes.
- Previous / next swaps the content with a short fade and rise; the page does not move. Closing then returns focus to the tab of the project now showing.
- The same motion on desktop and phone.

### Other special effects

- **Stamp press** (demo pages, once on load):

```css
@keyframes stamp-press {
  from { opacity: 0; scale: 1.12; }
  to { opacity: 1; scale: 1; }
}
.demo-sheet > .stamp { animation: stamp-press var(--d-stamp) var(--ease-settle) 300ms backwards; }
```

- **Drawer hint**: floats 6 px up and down, 2.4 s ease-in-out loop, only after the entrance ends.
- **Film tiles placeholder**: 14 tiles light up in a slow wave (4.2 s loop, 0.3 s offset each), paused when out of view.
- **Page transitions**: the browser's cross-document view transitions (`@view-transition { navigation: auto; }`), off with reduced motion. A project page's paper is named `leaf`. Leaving it for the drawer, the paper slides down (`--d-page-out`, `--ease-in`); arriving on it from a page without it, the paper is pulled up (`--d-page-in`, `--ease-paper`). Project to project and the language switch cross-fade (250 ms).
- **Mobile sheet**: see section 9.

### Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --d-hover: 0ms;
    --d-nudge: 0ms;
    --d-page-in: var(--d-fade);
    --d-page-out: var(--d-fade);
    --d-content: var(--d-fade);
    --d-stagger: 0ms;
    --d-enter: 0ms;
    --d-enter-stagger: 0ms;
    --d-stamp: 0ms;
    --m-hover-lift: 0px;
    --m-nudge: 0px;
    --m-rise: 0px;
  }
  .is-entering *,
  .drawer__hint,
  .film__tile { animation: none !important; }
  [data-reveal] { opacity: 1; translate: none; transition: none; }
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) { animation-duration: 150ms; }
}
```

Open and close become a 150 ms fade of the page. Loops stop, videos do not autoplay, the stamp appears without a press. The closed drawer does not tug, and opens without travelling: the open drawer fades in. Focus handling is the same as the full motion.

## 8. Do's and Don'ts

### Do

- Keep the cabinet concept on every page: paper for content, night for the room, the drawer as home.
- Use Serif Display for every heading, Serif Text for every story paragraph, Sans for everything else.
- Build hierarchy with size, family, color, case and space. One weight per family.
- Mirror every horizontal layout and motion in Arabic through logical properties. The drawer box is symmetric, so its walls use physical sides on purpose.
- Show the red "Sample data" stamp on every demo, always visible.
- Keep one accent per surface: signal on night, teal on paper.
- Test every new color pair for 4.5:1 text contrast and 3:1 control contrast before using it.
- Give every interactive element hover (pointer only), focus-visible and pressed states, and a 44 × 44 px target.
- Read layout once before a timeline; animate only transform, opacity and brightness.

### Don't

- ❌ No second weight of any thmanyah family, no other typeface, no synthetic bold.
- ❌ No gradients on text, no glow, no glassmorphism, no mesh gradients, no bento grids, no custom cursor, no grain overlay on night.
- ❌ No stock photos, no emoji, no icon libraries: inline SVG only.
- ❌ No scroll-jacking, no pinned sections, no parallax, no Lenis, no WebGL.
- ❌ Nothing spins or bounces hard. The open page is the only thing that enters from off-screen, and only from the bottom. Only a lifted folder may overshoot slightly.
- ❌ No `--c-ink-muted` or `--c-teal` text on folder faces, and no signal cyan on paper.
- ❌ No boxes inside the paper file: separate with hairlines, not bordered panels.
- ❌ No real numbers, logos, employer names or internal screenshots anywhere, including films, posters and demo data.
- ❌ No uppercase, letter-spacing or italics in Arabic.
- ❌ No animation of `box-shadow`, `width`, `height`, `top` or `filter: blur()`.
- ❌ No links to font files, and never list them as downloads.

---

## 9. Responsive Behavior

**Breakpoints**

| Name | Width | Key changes |
|---|---|---|
| Desktop | ≥ 1200 px | 12-column hero, the drawer at full container width, the open file in two columns |
| Compact desktop | 900 to 1199 px | same layout, `--step: 50px` |
| Mobile | < 900 px | 4-column grid, the same drawer seen closer (edge to edge, larger tabs), the open file in one column |

Test widths: 360, 390, 430, landscape 740, plus 1440 × 900 desktop.

**Touch targets**: minimum 44 × 44 px for every tab, button and link row. Phone tabs are 54 px tall.

**Collapsing strategy**

- The phone keeps the drawer, not a list: the same open box and staircase of tabs, taking the full width with bigger tabs and a wider step, so it reads as folders inside a drawer (owner's decision).
- Locked folders on the phone show a small lock in `--c-stamp` inside the tab instead of the stamp, because there is no free band between tabs for it.
- The drawer caption is not used on touch; the hint reads "Tap a file to pull it out".
- The open file becomes one column: title and film first, then the story, then actions, then previous / next.
- The masthead keeps name, card link and language switch on one row; the role line hides below 390 px.

```css
@media (max-width: 1199px) {
  .drawer__cabinet { --step: 50px; }
}

@media (max-width: 899px) {
  .grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .hero { padding-block: var(--s-4) var(--s-5); }
  .hero__kicker, .hero__title, .hero__lead { grid-column: 1 / -1; }
  .masthead__nav .btn { padding-inline: var(--s-4); }

  /* The same drawer, seen closer */
  .drawer { padding-inline: 6px; }
  .drawer__cabinet {
    --step: 68px; --tab-w: clamp(212px, 74%, 280px); --visible-front: 84px;
    --wall-front: 16px; --wall-back: 5px; --inset-back: 28px; --rim: 14px; --tab-pad: 10px;
    --stack-top: 88px;
  }
  .folder__sheet { padding: 8px var(--s-4) var(--s-8); }
  .folder__tab { gap: var(--s-2); min-block-size: 60px; padding: var(--s-2) var(--s-4) 4px; font-size: 1.0625rem; }
  .folder__num { font-size: 2rem; }
  .hero__title { margin-block-end: var(--s-5); font-size: 2.25rem; }
  .folder[data-locked] .stamp { display: none; }
  .folder__lock { display: inline-block; inline-size: 18px; block-size: 18px; }
  .drawer__caption { display: none; }
  .drawer__front { min-block-size: 124px; }

  /* The open file: one column */
  .leaf__bar-inner { min-block-size: 60px; }
  .leaf__body { grid-template-columns: 1fr; grid-template-rows: none; grid-template-areas: "head" "film" "story" "act"; padding-block: var(--s-5) var(--s-6); }
  .file__film { margin-block-start: var(--s-5); }
  .story { grid-template-columns: 1fr; margin-block-start: var(--s-6); }
  .story__block { padding: var(--s-5) 0 var(--s-2); border-inline-start: 0; border-block-start: 1px solid var(--c-paper-line); }
  .story__block:first-child { border-block-start: 0; }
  .file__act { padding-block-start: var(--s-5); }
}

@media (max-width: 389px) {
  .byline__role { display: none; }
  /* narrowest phones: a slightly wider, tighter tab so the longest short title still fits */
  .drawer__cabinet { --tab-w: clamp(210px, 72%, 250px); }
  .folder__tab { gap: 6px; padding-inline: var(--s-3); }
  .folder__num { font-size: 1.5rem; }
}
```

**Phone behaviour**: tap a folder; it nudges up and the page is pulled up from the bottom of the screen, exactly as on desktop. Close with the button in the top bar or the back gesture. Respect `env(safe-area-inset-bottom)` for the last row of actions. No backdrop blur.

---

## Open items for the owner

1. The Arabic swash or kashida on one word of the home H1: decided in the prototype.
2. LinkedIn URL and the email address in `content/site.json`.
