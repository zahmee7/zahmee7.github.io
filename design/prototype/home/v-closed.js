// Variant · the drawer starts closed (v-closed.css). This measures how far the drawer travels, turns the
// front into a button, and on press pulls the drawer out, then hands focus to the first folder.
(() => {
  const root = document.documentElement;
  const drawer = document.querySelector(".drawer");
  const cabinet = drawer?.querySelector(".drawer__cabinet");
  const front = drawer?.querySelector(".drawer__front");
  const hint = drawer?.querySelector("[data-hint] .drawer__hint-pointer");
  const hintTouch = drawer?.querySelector("[data-hint] .drawer__hint-touch");
  if (!drawer || !cabinet || !front) return;

  const ar = root.lang === "ar";
  const words = ar
    ? { open: "افتح درج المشاريع", press: "اضغط لتفتح الدرج" }
    : { open: "Open the project drawer", press: "Press to open the drawer" };

  // The travel: from under the title down to the drawer's place at the bottom
  const measure = () => {
    drawer.style.setProperty("--shift", `${cabinet.offsetHeight - 18}px`);
    drawer.style.setProperty("--front-h", `${front.offsetHeight}px`);
  };
  measure();
  new ResizeObserver(measure).observe(cabinet);

  // While closed, the folders cannot be reached, and the front says how to open it
  cabinet.inert = true;
  const before = { pointer: hint?.textContent, touch: hintTouch?.textContent };
  if (hint) hint.textContent = words.press;
  if (hintTouch) hintTouch.textContent = words.press;
  const opener = document.createElement("button");
  opener.type = "button";
  opener.className = "drawer__opener";
  opener.setAttribute("aria-label", words.open);
  front.append(opener);

  opener.addEventListener("click", () => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    opener.remove();
    cabinet.inert = false;
    if (hint) hint.textContent = before.pointer ?? "";
    if (hintTouch) hintTouch.textContent = before.touch ?? "";
    root.classList.add("drawer-opening");
    requestAnimationFrame(() => root.classList.add("drawer-opened"));
    setTimeout(
      () => {
        root.classList.remove("drawer-opening");
        drawer.querySelector(".folder__tab")?.focus({ preventScroll: true });
      },
      reduce ? 200 : 1150,
    );
  });
})();
