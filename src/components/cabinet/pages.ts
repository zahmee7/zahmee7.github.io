// The open file's pages (FileLeaf.astro): the project, the demo and the files, and the live demo. They turn
// in place the way previous and next move between files (file.ts, MOTION.md sequence 5, owner's request
// 2026-10-24): the page's blocks fade and lift a little, the next page's blocks rise in one after another,
// and the reader lands at its top. Reduced motion keeps only a short fade. One listener on the document, so
// the cabinet's open file, filled in when it opens (file.ts), works the same as the project page.

// file.ts: T.fade, T.content, T.stagger / 2, and the paper ease
const OUT = 150;
const IN = 450;
const STAGGER = 35;
const PAPER = "cubic-bezier(0.2, 0.7, 0.2, 1)";

let busy = false;

const reduced = (): boolean => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** A page's blocks in their reading order (--rise). */
function blocks(page: HTMLElement): HTMLElement[] {
  const order = (block: HTMLElement) => Number(block.style.getPropertyValue("--rise")) || 0;
  return [...page.querySelectorAll<HTMLElement>("[data-rise], [data-turn-rise]")].sort(
    (a, b) => order(a) - order(b),
  );
}

/** Pictures on a hidden page load lazily; fetch them first, so the page never rises in empty. */
function ready(page: HTMLElement): Promise<unknown> {
  const pictures = [...page.querySelectorAll("img")];
  for (const picture of pictures) picture.loading = "eager";
  const decoded = Promise.all(pictures.map((picture) => picture.decode().catch(() => undefined)));
  return Promise.race([decoded, new Promise((wait) => setTimeout(wait, 700))]);
}

async function turn(pages: HTMLElement, to: string): Promise<void> {
  const next = pages.querySelector<HTMLElement>(`[data-page="${to}"]`);
  const current = [...pages.querySelectorAll<HTMLElement>("[data-page]")].find((page) => !page.hidden);
  if (!next || !current || next === current || busy) return;
  busy = true;
  pages.dataset.turned = "";
  const quiet = reduced();
  await ready(next);

  const leaving = blocks(current);
  await Promise.all(
    leaving.map(
      (block) =>
        block.animate(
          quiet
            ? [{ opacity: 1 }, { opacity: 0 }]
            : [
                { opacity: 1, transform: "none" },
                { opacity: 0, transform: "translateY(-6px)" },
              ],
          { duration: OUT, easing: "ease-in", fill: "forwards" },
        ).finished,
    ),
  );
  current.hidden = true;
  next.hidden = false;
  for (const block of leaving) for (const animation of block.getAnimations()) animation.cancel();
  // The open file scrolls inside its dialog, the project page scrolls the window
  (pages.closest("dialog") ?? document.scrollingElement)?.scrollTo({ top: 0, behavior: "instant" });

  blocks(next).forEach((block, index) => {
    block.animate(
      quiet
        ? [{ opacity: 0 }, { opacity: 1 }]
        : [
            { opacity: 0, transform: "translateY(14px)" },
            { opacity: 1, transform: "none" },
          ],
      { duration: quiet ? OUT : IN, easing: PAPER, delay: quiet ? 0 : index * STAGGER, fill: "backwards" },
    );
  });

  // Land on the new page: its title, or on page one the turn the reader left from. The live demo opens
  // as its page does: the visitor pressed the demo card to come here.
  const landing =
    next.querySelector<HTMLElement>("[data-page-title]") ??
    next.querySelector<HTMLElement>(`[data-page-to="${current.dataset.page}"]`);
  landing?.focus({ preventScroll: true });
  next.querySelector("[data-live-frame]")?.dispatchEvent(new Event("live:open", { bubbles: true }));
  busy = false;
}

document.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const control = target?.closest<HTMLElement>("[data-page-to]");
  const pages = control?.closest<HTMLElement>("[data-pages]");
  if (!control || !pages) return;
  event.preventDefault(); // the demo card links to the demo page, for a browser without this script
  void turn(pages, control.dataset.pageTo ?? "1");
});

// A hand on a turn: start fetching the next page's pictures already
document.addEventListener("pointerover", (event) => {
  const control =
    event.target instanceof Element ? event.target.closest<HTMLElement>("[data-page-to]") : null;
  const page = control
    ?.closest("[data-pages]")
    ?.querySelector<HTMLElement>(`[data-page="${control.dataset.pageTo}"]`);
  if (page?.hidden) void ready(page);
});
