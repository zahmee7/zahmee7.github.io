// Shows a short message in the #toast live region (src/components/ui/Toast.astro) for 2.4 s.
// While a modal dialog is open the rest of the page is inert, so the toast moves into the dialog
// to stay visible and announced.
let timer: number | undefined;

export function showToast(message: string): void {
  const toast = document.getElementById("toast");
  if (!toast || !message) return;
  const host = document.querySelector("dialog[open]") ?? document.body;
  if (toast.parentElement !== host) host.append(toast);
  toast.textContent = message;
  toast.classList.add("is-on");
  window.clearTimeout(timer);
  timer = window.setTimeout(() => toast.classList.remove("is-on"), 2400);
}
