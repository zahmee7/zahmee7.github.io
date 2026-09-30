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

### 1. First load (home, once per session)

| Step | Element | Motion | Duration | Delay |
|---|---|---|---|---|
| 1 | Kicker, H1, lead | rise `--m-rise` + fade | 700 ms `--ease-paper` | 0, 100, 200 ms |
| 2 | Folders 1 → 6 | rise 120 px + fade, to their place in the drawer | `--d-enter` | 150 ms + i × `--d-enter-stagger` |
| 3 | Drawer hint | float 6 px, loop | 2.4 s ease-in-out | after step 2 |

A `sessionStorage` flag skips the entrance on later visits and when coming back from a project page.

### 2. Hover and focus on a folder (pointer devices)

- The folder lifts `--m-hover-lift` over `--d-hover` with `--ease-paper`.
- The drawer front swaps its hint for the folder's title and summary (or "Coming soon").
- Keyboard focus on the tab gives the same lift, the caption and the focus ring. Press: tab scales to 0.98.

### 3. Open a project: the page pull (desktop and phone)

| t (ms) | What happens |
|---|---|
| 0 | Tab pressed. The dialog opens with the paper page just below the screen (`y = 100vh`). Content blocks wait 14 px low, hidden. |
| 0 → 160 | The picked folder nudges up `--m-nudge`, `--ease-paper`. |
| 160 → 460 | It settles back into the drawer. |
| 100 → 820 | The page is pulled up to `y = 0`, `--d-page-in`, `--ease-paper`. The screen turns from night to paper. |
| 500 → 1300 | Content rises in, `--d-content` each, `--d-stagger` apart: tag, title, film, transcript, story blocks, actions, download, previous / next. |
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
- Play opens the full film with sound and captions.

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
- Open and close become a 150 ms fade of the page. Focus handling stays the same.
- The hint stops floating. Film tiles stay static, some lit.

## Performance checks

- 60 fps on a mid-range Android (Chrome DevTools, 4× CPU throttle): no long tasks during the pull.
- `will-change: transform` only on the page while it moves.
- The page behind the open dialog is locked (`html:has(dialog[open]) { overflow: hidden }`).
