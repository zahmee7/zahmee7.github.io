// Shows a short message in the #toast live region (src/components/ui/Toast.astro) for 2.4 s.
let timer: number | undefined;

export function showToast(message: string): void {
  const toast = document.getElementById("toast");
  if (!toast || !message) return;
  toast.textContent = message;
  toast.classList.add("is-on");
  window.clearTimeout(timer);
  timer = window.setTimeout(() => toast.classList.remove("is-on"), 2400);
}
