// The drawer's behaviour on the home page (DESIGN.md > Drawer front, MOTION.md sequences 1 to 3).
// - The drawer starts closed every time; the visitor pulls it out (pull.ts).
// - The drawer front captions the folder under the mouse or keyboard focus.
// - The whole folder face acts as its tab.
// - Locked folders say "Coming soon"; open folders open their page (file.ts).
// - With sound on, each of these has its sound (sound.ts).
// The motion code and the story font load on first intent, so the first view stays light.
import { bindSoon } from "../ui/soon";
import { showToast } from "../ui/toast";
import type { FileSheet } from "./file";
import "./pages";
import { setUpPull } from "./pull";
import { setUpSound } from "./sound";
import type { SoundName, SoundOptions } from "./synth";

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

  const folders = [...drawer.querySelectorAll<HTMLElement>(".folder")];
  let hit: number | undefined;
  const sound = setUpSound([...document.querySelectorAll<HTMLButtonElement>("[data-sound-switch]")], () => {
    const ahead: Array<[SoundName, SoundOptions]> = [
      ["open", {}],
      ["knock", {}],
    ];
    if (hit) ahead.push(["drawer", { hit }]);
    folders.forEach((_, index) => [0, 1, 2].forEach((turn) => ahead.push(["select", { index, turn }])));
    return ahead;
  });
  hit = setUpPull(drawer, (start) => sound.play("drawer", start));

  // A folder picked out: a flick of paper, at most one every 70 ms, in three slightly different takes
  let lastPick = 0;
  let turn = 0;
  const pick = (index: number): void => {
    const now = performance.now();
    if (now - lastPick < 70 || dialog.open) return;
    lastPick = now;
    turn = (turn + 1) % 3;
    sound.play("select", { index, turn });
  };

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

  for (const [index, folder] of folders.entries()) {
    folder.addEventListener("pointerenter", (event) => {
      if (event.pointerType !== "mouse") return;
      show(folder);
      pick(index);
    });
    folder.addEventListener("pointerleave", hide);
    folder.addEventListener("focusin", (event) => {
      show(folder);
      if (event.target instanceof Element && event.target.matches(":focus-visible")) pick(index);
    });
    folder.addEventListener("focusout", hide);

    folder.querySelector(".folder__sheet")?.addEventListener("click", () => {
      if (folder.hasAttribute("data-locked")) {
        sound.play("knock");
        showToast(drawer.dataset.lockedText ?? "");
      } else {
        sound.play("open");
        void openFolder(folder);
      }
    });
  }
}

const drawer = document.querySelector<HTMLElement>("[data-cabinet]");
if (drawer) setUp(drawer);
