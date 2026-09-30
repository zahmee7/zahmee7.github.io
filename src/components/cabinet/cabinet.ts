// The drawer's behaviour on the home page (DESIGN.md > Drawer front, MOTION.md sequences 2 and 3).
// - The drawer front captions the folder under the mouse or keyboard focus.
// - The whole folder face acts as its tab.
// - Locked folders say "Coming soon"; open folders open their page (file.ts).
// The motion code and the story font load on first intent, so the first view stays light.
import { bindSoon } from "../ui/soon";
import { showToast } from "../ui/toast";
import type { FileSheet } from "./file";

let fileModule: Promise<typeof import("./file")> | undefined;
let sheet: FileSheet | undefined;

function warmStoryFont(): void {
  const family = getComputedStyle(document.documentElement)
    .getPropertyValue("--font-thmanyah-text")
    .split(",")[0]
    ?.trim();
  if (family) document.fonts.load(`1em ${family}`).catch(() => undefined);
}

function prepare(): Promise<typeof import("./file")> {
  if (!fileModule) {
    fileModule = import("./file");
    warmStoryFont();
  }
  return fileModule;
}

function setUp(drawer: HTMLElement): void {
  const hint = drawer.querySelector<HTMLElement>("[data-hint]");
  const caption = drawer.querySelector<HTMLElement>("[data-caption]");
  const captionTitle = drawer.querySelector<HTMLElement>("[data-caption-title]");
  const captionText = drawer.querySelector<HTMLElement>("[data-caption-text]");
  const dialog = document.querySelector<HTMLDialogElement>("[data-file-sheet]");
  if (!hint || !caption || !captionTitle || !captionText || !dialog) return;
  // Bound here rather than in file.ts, so the lazy file chunk shares no module with this page's script
  // (a shared chunk gets a preload link, which Safari reports as unused).
  bindSoon(dialog, dialog.dataset.soonText ?? "");

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

  const openFolder = async (folder: HTMLElement): Promise<void> => {
    const { createFileSheet } = await prepare();
    sheet ??= createFileSheet(dialog, drawer);
    hide();
    sheet.open(folder);
  };

  for (const event of ["pointerenter", "focusin", "touchstart"] as const) {
    drawer.addEventListener(event, () => void prepare(), { once: true, passive: true });
  }

  for (const folder of drawer.querySelectorAll<HTMLElement>(".folder")) {
    folder.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "mouse") show(folder);
    });
    folder.addEventListener("pointerleave", hide);
    folder.addEventListener("focusin", () => show(folder));
    folder.addEventListener("focusout", hide);

    folder.querySelector(".folder__sheet")?.addEventListener("click", () => {
      if (folder.hasAttribute("data-locked")) showToast(drawer.dataset.lockedText ?? "");
      else void openFolder(folder);
    });
  }
}

const drawer = document.querySelector<HTMLElement>("[data-cabinet]");
if (drawer) setUp(drawer);
