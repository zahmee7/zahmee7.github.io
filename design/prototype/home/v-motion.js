// Variant D · the drawer tilts a little towards the pointer (at most 2 degrees), and settles back when the
// pointer leaves. Pointer devices only, never with reduced motion.
(() => {
  const drawer = document.querySelector(".drawer");
  const cabinet = document.querySelector(".drawer__cabinet");
  if (!drawer || !cabinet) return;
  if (!matchMedia("(hover: hover) and (prefers-reduced-motion: no-preference)").matches) return;

  let frame = 0;
  drawer.addEventListener("pointermove", (event) => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const box = drawer.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - 0.5;
      const y = (event.clientY - box.top) / box.height - 0.5;
      cabinet.style.setProperty("--ry", `${(x * 4).toFixed(2)}deg`);
      cabinet.style.setProperty("--rx", `${(-y * 3).toFixed(2)}deg`);
    });
  });
  drawer.addEventListener("pointerleave", () => {
    cancelAnimationFrame(frame);
    cabinet.style.removeProperty("--ry");
    cabinet.style.removeProperty("--rx");
  });
})();
