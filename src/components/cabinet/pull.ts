// The closed drawer (DESIGN.md > Closed drawer, MOTION.md sequence 1). The home page always starts with it
// closed (index.astro puts .drawer-closed and .drawer-cased on <html> before the first paint), and the
// visitor opens it (owner's rule): pressing the front pulls the drawer out like a real one. The motion comes from simple physics, so its parts agree with each
// other and with the sound (synth.ts):
// - the pull: a heavy start, full speed in the middle, and still moving when it reaches the stop;
// - the stop: a stiff rubber bumper, so the drawer gives a few pixels and rebounds once;
// - the folders hang on rails, so they lag as the drawer sets off, swing forward at the stop and settle.
// The curves are sampled into Web Animations keyframes: transform only, nothing measured while it runs.

export interface PullStart {
  /** Seconds from the press to the stop; missing with reduced motion. */
  hit?: number;
  reduce?: boolean;
}

const STEP = 1 / 120; // keyframe spacing, in seconds
const OVERLAP = 18; // the front overlaps the box (Cabinet.astro)
const SETTLE = 0.45; // the bumper's rebound, after the stop
const SWAY = 1; // the folders' swing, after the stop

/** Seconds from the press to the stop: a little longer for a longer drawer. */
export function pullTime(travel: number): number {
  return Math.round(Math.min(0.92, Math.max(0.72, 0.55 + travel / 1900)) * 1000) / 1000;
}

/** The drawer's path (px, growing towards the visitor) and its acceleration, over time (s). */
function motion(travel: number, hit: number): { at: (t: number) => number; accel: (t: number) => number } {
  // the pull: a cubic from rest to speed m (as a share of the average speed) at the stop
  const m = 0.6;
  const a0 = travel / (hit * hit);
  // the bumper: a stiff spring, about 5.5 swings a second, well damped
  const w = 2 * Math.PI * 5.5;
  const damp = 0.42 * w;
  const wd = w * Math.sqrt(1 - 0.42 * 0.42);
  const reach = (m * travel) / hit / wd;
  return {
    at: (t) => {
      if (t < hit) {
        const u = t / hit;
        return -travel + travel * (2.4 * u * u - 1.4 * u ** 3);
      }
      const s = t - hit;
      return Math.exp(-damp * s) * reach * Math.sin(wd * s);
    },
    accel: (t) => {
      if (t < hit) return a0 * (4.8 - 8.4 * (t / hit));
      const s = t - hit;
      const decay = reach * Math.exp(-damp * s);
      return decay * ((damp * damp - wd * wd) * Math.sin(wd * s) - 2 * damp * wd * Math.cos(wd * s));
    },
  };
}

/** A hanging folder: a pendulum pushed by the drawer's acceleration; front folders hang stiffer. */
function sway(accel: (t: number) => number, index: number, seconds: number): number[] {
  const w = 2 * Math.PI * (2.2 + 0.22 * index);
  const damping = 0.26;
  const gain = 0.3;
  const dt = 1 / 1200;
  const every = Math.round(STEP / dt);
  const out: number[] = [];
  let r = 0;
  let v = 0;
  for (let k = 0; k * dt <= seconds; k++) {
    if (k % every === 0) out.push(r);
    v += (-gain * accel(k * dt) - w * w * r - 2 * damping * w * v) * dt;
    r += v * dt;
  }
  // ease out what is left of the swing in the last fifth of a second, so it ends exactly at rest
  const tail = Math.round(0.2 / STEP);
  for (let k = 0; k < tail; k++) out[out.length - 1 - k]! *= k / tail;
  return out.map((y) => Math.max(-9, Math.min(12, y)));
}

const frames = (values: number[], extra: (t: number) => number = () => 0): Keyframe[] =>
  values.map((y, k) => ({
    transform: `translateY(${(y + extra(k * STEP)).toFixed(2)}px)`,
    offset: k / (values.length - 1),
  }));

/**
 * Sets up the closed drawer, if this visit shows one. onPull runs inside the press, so a sound can start
 * with it. Returns the time from a press to the stop, for drawing the sound ahead.
 */
export function setUpPull(drawer: HTMLElement, onPull: (start: PullStart) => void): number | undefined {
  const root = document.documentElement;
  if (!root.classList.contains("drawer-closed")) return undefined;
  const cabinet = drawer.querySelector<HTMLElement>(".drawer__cabinet");
  const front = drawer.querySelector<HTMLElement>(".drawer__front");
  const opener = drawer.querySelector<HTMLButtonElement>("[data-opener]");
  if (!cabinet || !front || !opener) {
    root.classList.remove("drawer-closed", "drawer-cased");
    return undefined;
  }
  const folders = [...drawer.querySelectorAll<HTMLElement>(".folder")];
  const travel = () => cabinet.offsetHeight - OVERLAP;
  cabinet.inert = true;

  const release = () => front.classList.remove("is-pressed");
  opener.addEventListener("pointerdown", () => front.classList.add("is-pressed"));
  for (const type of ["pointerup", "pointerleave", "pointercancel"] as const) {
    opener.addEventListener(type, release);
  }

  opener.addEventListener(
    "click",
    () => {
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      opener.setAttribute("aria-expanded", "true");
      release();
      const open = () => {
        root.classList.remove("drawer-closed", "drawer-pulling");
        cabinet.inert = false;
        drawer.querySelector<HTMLElement>(".folder__tab")?.focus({ preventScroll: true });
      };
      const uncase = () => root.classList.remove("drawer-cased", "drawer-lit", "drawer-faded");

      if (reduce) {
        onPull({ reduce: true });
        root.classList.add("drawer-lit", "drawer-faded");
        open();
        setTimeout(uncase, 400);
        return;
      }

      const distance = travel();
      const hit = pullTime(distance);
      const path = motion(distance, hit);
      const drawerValues: number[] = [];
      for (let k = 0; k * STEP < hit + SETTLE; k++) drawerValues.push(path.at(k * STEP));
      drawerValues.push(0);
      // the front may be mid-tug: carry its offset into the pull and let it fade in the first 0.3 s
      const tug = parseFloat(getComputedStyle(front).translate.split(" ")[1] ?? "0") || 0;

      root.classList.add("drawer-pulling");
      onPull({ hit });
      const timing = (seconds: number): KeyframeAnimationOptions => ({
        duration: seconds * 1000,
        easing: "linear",
        fill: "both",
      });
      const moves = [
        cabinet.animate(frames(drawerValues), timing(hit + SETTLE)),
        front.animate(
          frames(drawerValues, (t) => tug * Math.max(0, 1 - t / 0.3)),
          timing(hit + SETTLE),
        ),
      ];
      const swings = folders.map((folder, index) =>
        folder.animate(frames(sway(path.accel, index, hit + SWAY)), timing(hit + SWAY)),
      );

      setTimeout(() => root.classList.add("drawer-lit"), hit * 1000 + 60);
      void Promise.allSettled(moves.map((move) => move.finished)).then(() => {
        open();
        for (const move of moves) move.cancel();
      });
      void Promise.allSettled(swings.map((swing) => swing.finished)).then(() => {
        for (const swing of swings) swing.cancel();
        uncase();
      });
    },
    { once: true },
  );

  return pullTime(travel());
}
