// The page pull (DESIGN.md section 7, MOTION.md sequences 3 to 5). Loaded on first intent by cabinet.ts.
// Open: the folder nudges up and a page of paper is pulled up from the bottom over the cabinet.
// Close: the page slides back down. Close by button, Esc, browser back or the Android back gesture.
// While a file is open the address bar and tab title show its project page, so the link can be shared
// and a reload lands on that page.
import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(CustomEase);
CustomEase.create("paper", "0.2,0.7,0.2,1");
CustomEase.create("paperIn", "0.4,0,0.8,0.3");

const T = {
  nudge: 0.16,
  settle: 0.3,
  pageIn: 0.72,
  pageOut: 0.5,
  content: 0.45,
  stagger: 0.07,
  fade: 0.15,
} as const;
const NUDGE = 14; // px, --m-nudge

const reducedMotion = (): boolean => matchMedia("(prefers-reduced-motion: reduce)").matches;

export interface FileSheet {
  open(folder: HTMLElement): void;
}

export function createFileSheet(dialog: HTMLDialogElement, drawer: HTMLElement): FileSheet {
  const leaf = dialog.querySelector<HTMLElement>(".leaf")!;
  const body = dialog.querySelector<HTMLElement>("[data-leaf-body]")!;
  const folioLine = dialog.querySelector<HTMLElement>("[data-folio]")!;
  const prev = dialog.querySelector<HTMLButtonElement>('[data-step="-1"]')!;
  const next = dialog.querySelector<HTMLButtonElement>('[data-step="1"]')!;
  const templates = [...document.querySelectorAll<HTMLTemplateElement>("template[data-file]")];
  const openIds = templates.map((template) => template.dataset.file ?? "");
  const home = { url: location.href, title: document.title };

  let current: { id: string; folder: HTMLElement } | null = null;
  let busy = false;
  let pendingClose = false;

  // In the order set by --rise (FileLeaf.astro), which follows the layout rather than the DOM
  const rise = (element: HTMLElement): number => Number(element.style.getPropertyValue("--rise"));
  const risers = (): HTMLElement[] =>
    [...dialog.querySelectorAll<HTMLElement>("[data-rise]")].sort((a, b) => rise(a) - rise(b));
  const tabOf = (folder: HTMLElement) => folder.querySelector<HTMLButtonElement>(".folder__tab")!;
  const sheetOf = (folder: HTMLElement) => folder.querySelector<HTMLElement>(".folder__sheet")!;
  const folderOf = (id: string) => drawer.querySelector<HTMLElement>(`.folder[data-id="${id}"]`)!;
  const focusTitle = (): void =>
    body.querySelector<HTMLElement>(".file__title")?.focus({ preventScroll: true });

  function setDisabled(button: HTMLButtonElement, off: boolean): void {
    if (off) button.setAttribute("aria-disabled", "true");
    else button.removeAttribute("aria-disabled");
  }

  /** Puts a project's page in the dialog; returns its address for the history entry. */
  function fill(id: string): string {
    const template = templates.find((item) => item.dataset.file === id);
    if (!template) return home.url;
    body.replaceChildren(template.content.cloneNode(true));
    document.title = template.dataset.pageTitle ?? home.title;
    folioLine.textContent = template.dataset.folioText ?? "";
    dialog.setAttribute("aria-labelledby", `file-title-${id}`);
    const index = openIds.indexOf(id);
    setDisabled(prev, index <= 0);
    setDisabled(next, index >= openIds.length - 1);
    return template.dataset.url ?? home.url;
  }

  function markActive(folder: HTMLElement, active: boolean): void {
    tabOf(folder).setAttribute("aria-expanded", String(active));
    if (active) folder.dataset.active = "";
    else delete folder.dataset.active;
  }

  /** Ends an animation; runs a close that was asked for meanwhile. */
  function settled(): void {
    busy = false;
    if (pendingClose) {
      pendingClose = false;
      close();
    }
  }

  /** push is false when the browser's forward button brings the file back: its entry exists already. */
  function open(folder: HTMLElement, push = true): void {
    if (busy || current) return;
    const id = folder.dataset.id ?? "";
    if (!openIds.includes(id)) return;
    busy = true;
    const url = fill(id);
    current = { id, folder };
    markActive(folder, true);
    drawer.dataset.open = "";
    if (push) history.pushState({ file: id }, "", url);

    gsap.set(risers(), { autoAlpha: 0, y: 14 });
    gsap.set(leaf, { clearProps: "transform,opacity,visibility" });
    const root = document.documentElement;
    root.style.setProperty("--scroll-gap", `${window.innerWidth - root.clientWidth}px`);
    dialog.showModal();
    dialog.scrollTop = 0;

    if (reducedMotion()) {
      gsap.set(risers(), { autoAlpha: 1, y: 0 });
      gsap.fromTo(
        leaf,
        { autoAlpha: 0 },
        {
          autoAlpha: 1,
          duration: T.fade,
          onComplete: () => {
            focusTitle();
            settled();
          },
        },
      );
      return;
    }

    gsap.set(leaf, { y: window.innerHeight });
    gsap
      .timeline({
        onComplete: () => {
          gsap.set(sheetOf(folder), { clearProps: "transform" });
          settled();
        },
      })
      .to(sheetOf(folder), { y: -NUDGE, duration: T.nudge, ease: "paper" }, 0)
      .to(sheetOf(folder), { y: 0, duration: T.settle, ease: "paper" }, T.nudge)
      .to(leaf, { y: 0, duration: T.pageIn, ease: "paper" }, 0.1)
      .to(risers(), { autoAlpha: 1, y: 0, duration: T.content, ease: "paper", stagger: T.stagger }, 0.5)
      .add(focusTitle, 0.82);
  }

  function close(): void {
    if (!current) return;
    if (busy) {
      pendingClose = true;
      return;
    }
    busy = true;
    const { folder } = current;

    const done = (): void => {
      document.title = home.title;
      if (location.href !== home.url) history.replaceState(null, "", home.url);
      dialog.close();
      document.documentElement.style.removeProperty("--scroll-gap");
      gsap.set(leaf, { clearProps: "transform,opacity,visibility" });
      body.replaceChildren();
      markActive(folder, false);
      delete drawer.dataset.open;
      tabOf(folder).focus({ preventScroll: true });
      current = null;
      busy = false;
    };

    dialog.scrollTop = 0;
    if (reducedMotion()) {
      gsap.to(leaf, { autoAlpha: 0, duration: T.fade, onComplete: done });
      return;
    }
    gsap.to(leaf, { y: window.innerHeight, duration: T.pageOut, ease: "paperIn", onComplete: done });
  }

  /** Closing goes through history, so the browser and Android back gesture behave the same. */
  function requestClose(): void {
    if ((history.state as { file?: string } | null)?.file) history.back();
    else close();
  }

  function go(step: number): void {
    if (!current || busy) return;
    const id = openIds[openIds.indexOf(current.id) + step];
    if (!id) return;
    busy = true;
    gsap.to(risers(), {
      autoAlpha: 0,
      y: -6,
      duration: T.fade,
      onComplete: () => {
        if (!current) return;
        markActive(current.folder, false);
        const folder = folderOf(id);
        markActive(folder, true);
        current = { id, folder };
        history.replaceState({ file: id }, "", fill(id));
        dialog.scrollTop = 0;
        gsap.fromTo(
          risers(),
          { autoAlpha: 0, y: 14 },
          {
            autoAlpha: 1,
            y: 0,
            duration: T.content,
            ease: "paper",
            stagger: T.stagger / 2,
            onComplete: () => {
              focusTitle();
              settled();
            },
          },
        );
      },
    });
  }

  addEventListener("popstate", (event) => {
    if (current) close();
    else {
      const id = (event.state as { file?: string } | null)?.file;
      if (id && openIds.includes(id)) open(folderOf(id), false);
    }
  });
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    requestClose();
  });
  dialog.querySelector("[data-close]")?.addEventListener("click", requestClose);
  for (const button of [prev, next]) {
    button.addEventListener("click", () => {
      if (!button.hasAttribute("aria-disabled")) go(Number(button.dataset.step));
    });
  }

  return { open };
}
