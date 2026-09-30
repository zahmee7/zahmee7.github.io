// The drawer's behaviour on the home page (DESIGN.md > Drawer front, MOTION.md sequence 2).
// - The drawer front captions the folder under the mouse or keyboard focus.
// - The whole folder face acts as its tab.
// - Locked folders say "Coming soon"; open folders announce cabinet:open (Phase 3 opens the page).
import { showToast } from "../ui/toast";

function setUp(drawer: HTMLElement): void {
  const hint = drawer.querySelector<HTMLElement>("[data-hint]");
  const caption = drawer.querySelector<HTMLElement>("[data-caption]");
  const captionTitle = drawer.querySelector<HTMLElement>("[data-caption-title]");
  const captionText = drawer.querySelector<HTMLElement>("[data-caption-text]");
  if (!hint || !caption || !captionTitle || !captionText) return;

  const show = (folder: HTMLElement): void => {
    if (drawer.hasAttribute("data-open")) return;
    captionTitle.textContent = folder.dataset.title ?? "";
    captionText.textContent = folder.dataset.note ?? "";
    hint.hidden = true;
    caption.hidden = false;
  };
  const hide = (): void => {
    hint.hidden = false;
    caption.hidden = true;
  };

  for (const folder of drawer.querySelectorAll<HTMLElement>(".folder")) {
    folder.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "mouse") show(folder);
    });
    folder.addEventListener("pointerleave", hide);
    folder.addEventListener("focusin", () => show(folder));
    folder.addEventListener("focusout", hide);

    folder.querySelector(".folder__sheet")?.addEventListener("click", () => {
      if (folder.hasAttribute("data-locked")) {
        showToast(drawer.dataset.lockedText ?? "");
        return;
      }
      drawer.dispatchEvent(
        new CustomEvent("cabinet:open", { bubbles: true, detail: { id: folder.dataset.id } }),
      );
    });
  }
}

const drawer = document.querySelector<HTMLElement>("[data-cabinet]");
if (drawer) setUp(drawer);
