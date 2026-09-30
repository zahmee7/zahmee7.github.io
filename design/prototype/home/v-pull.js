// Variant · the closed drawer, pulled like a real one (v-pull.css). The motion is worked out from simple
// physics, so its parts agree with each other and with the sounds (v-sound.js):
// - the pull: a heavy start, full speed in the middle, and still moving when it reaches the stop;
// - the stop: a stiff rubber bumper, so the drawer gives a few pixels and rebounds once;
// - the folders hang on rails, so they lag as the drawer sets off, swing forward at the stop and settle.
// The curves are sampled into Web Animations keyframes: transform only, nothing measured while it runs.
(() => {
  const root = document.documentElement;
  const drawer = document.querySelector(".drawer");
  const cabinet = drawer?.querySelector(".drawer__cabinet");
  const front = drawer?.querySelector(".drawer__front");
  const hint = drawer?.querySelector("[data-hint] .drawer__hint-pointer");
  const hintTouch = drawer?.querySelector("[data-hint] .drawer__hint-touch");
  if (!drawer || !cabinet || !front) return;
  const folders = [...drawer.querySelectorAll(".folder")];

  const ar = root.lang === "ar";
  const words = ar
    ? { open: "افتح درج المشاريع", press: "اضغط لتفتح الدرج" }
    : { open: "Open the project drawer", press: "Press to open the drawer" };

  // The cabinet around the closed drawer: its top edge, the shadow under it, and the drawers below
  const part = (name) => {
    const el = document.createElement("div");
    el.className = name;
    el.setAttribute("aria-hidden", "true");
    return el;
  };
  const body = part("drawer__body");
  drawer.prepend(body);
  drawer.append(part("drawer__shade"), part("drawer__lip"));

  let shift = 0;
  const pullTime = (S) => Math.round(Math.min(0.92, Math.max(0.72, 0.55 + S / 1900)) * 1000) / 1000;
  const measure = () => {
    if (root.classList.contains("drawer-pulling")) return;
    shift = cabinet.offsetHeight - 18; // the front overlaps the box by 18 px (Cabinet.astro)
    const frontH = front.offsetHeight;
    drawer.style.setProperty("--shift", `${shift}px`);
    drawer.style.setProperty("--front-h", `${frontH}px`);
    drawer.dataset.pullHit = String(pullTime(shift)); // v-sound.js draws the matching sound ahead
    const need = Math.ceil(drawer.offsetHeight / (frontH + 12));
    while (body.childElementCount < need) {
      const below = part("drawer__below");
      below.append(part("drawer__below-label"), part("drawer__below-pull"));
      body.append(below);
    }
  };
  measure();
  new ResizeObserver(measure).observe(drawer);

  // While closed, the folders cannot be reached and the front says how to open it
  cabinet.inert = true;
  const before = { pointer: hint?.textContent, touch: hintTouch?.textContent };
  if (hint) hint.textContent = words.press;
  if (hintTouch) hintTouch.textContent = words.press;
  const opener = document.createElement("button");
  opener.type = "button";
  opener.className = "drawer__opener";
  opener.setAttribute("aria-label", words.open);
  front.append(opener);

  const press = () => front.classList.add("is-pressed");
  const release = () => front.classList.remove("is-pressed");
  opener.addEventListener("pointerdown", press);
  for (const type of ["pointerup", "pointerleave", "pointercancel"]) opener.addEventListener(type, release);

  // ---------- The motion, in pixels and seconds; y grows towards the visitor ----------
  const STEP = 1 / 120; // keyframe spacing
  const plan = (S) => {
    const T = pullTime(S); // the pull, longer for a longer drawer
    const m = 0.6; // speed left at the stop, as a share of the average speed
    const A = S / (T * T);
    const vHit = (m * S) / T;
    // the bumper: a stiff spring, about 5.5 swings a second, well damped
    const w = 2 * Math.PI * 5.5;
    const z = 0.42;
    const a = z * w;
    const wd = w * Math.sqrt(1 - z * z);
    const V = vHit / wd;
    const settle = 0.45;
    // position: a cubic that starts at rest and arrives with speed m, then the bumper's rebound
    const x = (t) => {
      if (t < T) {
        const u = t / T;
        return -S + S * (-1.4 * u ** 3 + 2.4 * u ** 2);
      }
      const s = t - T;
      return Math.exp(-a * s) * V * Math.sin(wd * s);
    };
    const accel = (t) => {
      if (t < T) return A * (4.8 - 8.4 * (t / T));
      const s = t - T;
      return V * Math.exp(-a * s) * ((a * a - wd * wd) * Math.sin(wd * s) - 2 * a * wd * Math.cos(wd * s));
    };
    // the hanging folders: a pendulum each, pushed by the drawer's acceleration, front ones stiffer
    const swayFor = (i) => {
      const wf = 2 * Math.PI * (2.2 + 0.22 * i);
      const zf = 0.26;
      const gain = 0.3;
      const total = T + 1.0;
      const dt = 1 / 1200;
      const every = Math.round(STEP / dt);
      let r = 0;
      let v = 0;
      const out = [];
      for (let k = 0; k * dt <= total; k++) {
        if (k % every === 0) out.push(r);
        const acc = -gain * accel(k * dt) - wf * wf * r - 2 * zf * wf * v;
        v += acc * dt;
        r += v * dt;
      }
      // ease out whatever sway is left in the last fifth of a second, so it ends exactly at rest
      const tail = Math.round(0.2 / STEP);
      for (let k = 0; k < tail; k++) out[out.length - 1 - k] *= k / tail;
      return { values: out.map((r) => Math.max(-9, Math.min(12, r))), duration: total };
    };
    const drawerValues = [];
    for (let t = 0; t <= T + settle; t += STEP) drawerValues.push(t > T + settle - STEP ? 0 : x(t));
    drawerValues.push(0);
    return { T, settle, vHit, drawerValues, swayFor };
  };

  const keyframes = (values, extra = () => 0) =>
    values.map((y, k) => ({
      transform: `translateY(${(y + extra(k * STEP)).toFixed(2)}px)`,
      offset: k / (values.length - 1),
    }));

  opener.addEventListener("click", () => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    opener.remove();
    release();
    if (hint) hint.textContent = before.pointer ?? "";
    if (hintTouch) hintTouch.textContent = before.touch ?? "";

    const done = () => {
      root.classList.add("drawer-opened");
      root.classList.remove("drawer-pulling");
      cabinet.inert = false;
      drawer.querySelector(".folder__tab")?.focus({ preventScroll: true });
    };

    if (reduce) {
      document.dispatchEvent(new CustomEvent("cabinet:pull", { detail: { reduce: true } }));
      root.classList.add("drawer-lit", "drawer-faded");
      done();
      return;
    }

    const p = plan(shift);
    // the front may be mid-nudge: carry its offset into the pull and let it fade in the first 0.3 s
    const nudge = parseFloat(getComputedStyle(front).translate.split(" ")[1] ?? "0") || 0;
    root.classList.add("drawer-pulling");
    document.dispatchEvent(new CustomEvent("cabinet:pull", { detail: { hit: p.T, speed: p.vHit / shift } }));

    const timing = (seconds) => ({ duration: seconds * 1000, easing: "linear", fill: "both" });
    const moves = [
      cabinet.animate(keyframes(p.drawerValues), timing(p.T + p.settle)),
      front.animate(
        keyframes(p.drawerValues, (t) => nudge * Math.max(0, 1 - t / 0.3)),
        timing(p.T + p.settle),
      ),
    ];
    const sways = folders.map((folder, i) => {
      const sway = p.swayFor(i);
      return folder.animate(keyframes(sway.values), timing(sway.duration));
    });

    setTimeout(() => root.classList.add("drawer-lit"), p.T * 1000 + 60);
    Promise.all(moves.map((m) => m.finished)).then(() => {
      done();
      for (const m of moves) m.cancel();
    });
    Promise.all(sways.map((s) => s.finished)).then(() => {
      for (const s of sways) s.cancel();
    });
  });
})();
