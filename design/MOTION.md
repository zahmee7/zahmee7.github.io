# Motion spec · Project Files

Generated from `DESIGN.md` section 7 (approved 2026-09-30, after the prototype review). `DESIGN.md` wins on any difference: change it first, then regenerate this file. Reference implementation: `design/prototype/cabinet.js`, motion style 1.

One idea carries the whole site: **paper in a drawer**. Folders lift and settle like light card; opening a project pulls a page of paper up over the cabinet, as if you stepped into the file. Nothing spins or bounces hard.

Tokens live in `design/tokens.css`.

## Principles

1. **Physical, not decorative.** Motion explains where the page came from and where it goes back to.
2. **One thing moves at a time.** The folder, then the page, then the content.
3. **Fast to interact, slow to admire.** Taps respond within 100 ms. The page arrives in under a second and takes focus at 0.82 s.
4. **Transforms and opacity only.** Nothing reads layout inside an animation.
5. **Direction follows reading direction** for anything horizontal. The page pull is vertical, the same in both languages.
6. **Visitors see only folders.** Project content appears only after a folder is opened (owner's rule).

## Sequences

### 1. First load (home, once per session): the closed drawer

The first visit of a session starts with the drawer closed (`DESIGN.md` > Closed drawer). A `sessionStorage` flag skips both the entrance and the closed drawer on later visits and when coming back from a project page.

| Step | Element | Motion | Duration | Delay |
|---|---|---|---|---|
| 1 | Kicker, H1, lead | rise `--m-rise` + fade | 700 ms `--ease-paper` | 0, 100, 200 ms |
| 2 | The closed cabinet | slides into view: up 56 px and from 0.965 scale + fade | 850 ms `--ease-paper` | 80 ms |
| 3 | The closed front | a tug: 7 px towards you, back to 1, out to 4, home; loop | 3.2 s `--ease-paper` | 900 ms |
| 4 | Drawer hint | float 6 px, loop | 2.4 s ease-in-out | 1.9 s |

### 1b. Pull the drawer out (on press, first visit only)

Worked out from simple physics in `src/components/cabinet/pull.ts`, sampled into Web Animations keyframes. Transform only.

| t | What happens |
|---|---|
| press | The front gives (scale 0.992) and the pull drops 2 px, 120 ms. |
| 0 | The front and the box set off together; a tug in progress fades out of the path in 0.3 s. The folders lag behind. |
| 0 → hit | The pull: a cubic from rest, fastest in the middle, still at 0.6 × the average speed when it reaches the stop. hit = 0.72 to 0.92 s by drawer length. |
| hit | The stop: a stiff bumper (5.5 Hz, damping 0.42), about 7 px in and 2 px back, settled 0.45 s later. The folders swing forward on their rails (2.2 to 3.3 Hz, damping 0.26). |
| hit + 60 ms | The lamp comes on (900 ms); the cabinet's top edge, its shadow and the drawers below fade out (360 to 800 ms). |
| hit + 0.45 s | Open: the folders can be reached and focus moves to the first tab. |
| hit + 1 s | The folders have settled; the cabinet around the drawer is gone. |

### 2. Hover and focus on a folder (pointer devices)

- The folder lifts `--m-hover-lift` (24 px) over 1.3 × `--d-hover` with `--ease-settle`, and the other folders step back (brightness 0.9, saturation 0.92).
- The drawer front swaps its hint for the folder's title and summary (or "Coming soon").
- Keyboard focus on the tab gives the same lift, the caption and the focus ring. Press: tab scales to 0.98.

### 3. Open a project: the page pull (desktop and phone)

| t (ms) | What happens |
|---|---|
| 0 | Tab pressed. The dialog opens with the paper page just below the screen (`y = 100vh`). Content blocks wait 14 px low, hidden. |
| 0 → 160 | The picked folder nudges up `--m-nudge`, `--ease-paper`. |
| 160 → 460 | It settles back into the drawer. |
| 100 → 820 | The page is pulled up to `y = 0`, `--d-page-in`, `--ease-paper`. The screen turns from night to paper. |
| 500 → 1300 | Content rises in, `--d-content` each, `--d-stagger` apart: tag, title, summary, film, demo and download, the three story blocks, previous / next. |
| 820 | Focus moves to the file title. |

### 4. Close a project

The page slides back down below the screen with its content in place, `--d-page-out`, `--ease-in`. The dialog closes and focus returns to the tab. The dialog scrolls to the top first.

Triggers: the close button in the top bar, `Esc`, browser back and the Android back gesture (opening pushes a history entry). A close asked for while the page is still opening, or while previous / next is swapping, runs right after.

### 5. Previous / next inside the page

Content fades up 6 px (150 ms), swaps, then rises in with half the stagger. The page does not move. Closing afterwards returns focus to the tab of the project now showing.

### 6. Project page (direct visit)

No folder to come from. The page is already there; its content rises in as in sequence 3 (CSS keyframes, `--d-content`, `--d-stagger`).

Close is a link back to the drawer. The paper slides down over the cabinet (view transition, `--d-page-out`, `--ease-in`), and the drawer's first-load entrance does not play. Previous / next and the language switch cross-fade, then the content rises in.

### 7. Film placeholder and film

- Placeholder: 14 tiles light up in a slow wave (4.2 s loop, 0.3 s offset each), only while the page is open and the film is in view.
- Real film loop: autoplay muted only when ≥ 50 % visible, pause when hidden.
- Play swaps the loop for the full film in the same frame, with the browser's controls (sound, captions in both languages, full screen). The film starts at once; focus moves to it.
- With reduced motion nothing plays or loads by itself: the poster stands still until Play.

### 8. Micro-interactions

| Element | Motion |
|---|---|
| Buttons | border and background 200 ms, press scale 0.98 |
| Download | arrow nudges 3 px down on hover |
| Language switch | page cross-fades via view transition, 250 ms |
| Toast | rises 12 px + fade, 250 ms, hides after 2.4 s |
| Demo stamp | presses in once: scale 1.12 → 1 + fade, `--d-stamp`, `--ease-settle`, 300 ms after load |

## Reduced motion

When `prefers-reduced-motion: reduce` is set:

- No lifts, no nudge, no pull, no stagger, no loops, no autoplay.
- The closed drawer does not tug, and opens without travelling: the open drawer fades in (150 ms). Its sound, if on, is only the latch and a soft knock.
- Open and close become a 150 ms fade of the page. Focus handling stays the same.
- The hint stops floating. Film tiles stay static, some lit.

## Sound

Off until the visitor turns it on (`DESIGN.md` > Sound). Each sound starts inside the press it answers and follows the motion above.

| Moment | Sound | Timing |
|---|---|---|
| Pull (1b) | latch, roll with bearing ticks, thud and ring at the stop, rebound knock, folders rustling | latch at the press; roll to hit; stop at hit; rebound at hit + 125 ms; rustle to hit + 0.5 s |
| Pick a folder (2) | a short flick of paper | at the lift; at most one every 70 ms |
| Open a project (3) | a tap, then a swish that follows the page's speed | tap at the press; swish from 100 ms, fading by 820 ms |
| Locked folder | two muted knocks | 0 and 120 ms |

## Performance checks

- 60 fps on a mid-range Android (Chrome DevTools, 4× CPU throttle): no long tasks during the pull.
- `will-change: transform` only on the page while it moves.
- The page behind the open dialog is locked (`html:has(dialog[open]) { overflow: hidden }`).
