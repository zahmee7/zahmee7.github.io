// Parts built in later phases (film, demo, download) carry data-soon: a click says "Coming soon"
// instead of following the link.
import { showToast } from "./toast";

export function bindSoon(root: HTMLElement, text: string): void {
  root.addEventListener("click", (event) => {
    const soon = (event.target as Element).closest("[data-soon]");
    if (!soon) return;
    event.preventDefault();
    showToast(text);
  });
}
