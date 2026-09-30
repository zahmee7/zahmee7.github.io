// The drawer's sound switch (DESIGN.md > Sound). Sound is off until the visitor turns it on; the choice is
// kept in this browser. The sounds are drawn by synth.ts, which loads only once sound is on. Browsers let a
// page make sound only after a press, so the audio starts inside one: the switch itself, or, when an
// earlier visit left sound on, the first press on the page (usually the one that opens the drawer).
import type { Kit, SoundName, SoundOptions } from "./synth";

const KEY = "drawer-sound";

export interface Sound {
  /** Plays a sound if sound is on. Call it inside the press it answers, where there is one. */
  play(name: SoundName, options?: SoundOptions): void;
}

function stored(): boolean {
  try {
    return localStorage.getItem(KEY) === "on";
  } catch {
    return false;
  }
}

function store(on: boolean): void {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    // storage is blocked: the choice holds for this visit only
  }
}

/**
 * Wires the switches (one in the masthead on wide screens, one by the title on phones) and returns the
 * player. ahead lists the sounds to draw as soon as the sound code is in, before any press needs them.
 */
export function setUpSound(
  switches: HTMLButtonElement[],
  ahead: () => Array<[SoundName, SoundOptions]>,
): Sound {
  let on = stored();
  let ctx: AudioContext | undefined;
  let kit: Kit | undefined;
  let synth: Promise<typeof import("./synth") | undefined> | undefined;

  const load = () =>
    (synth ??= import("./synth")
      .then((module) => {
        setTimeout(() => module.warm(ahead()), 0);
        return module;
      })
      .catch(() => undefined));

  // Inside a press: start the audio, or wake it
  const wake = (): AudioContext | undefined => {
    try {
      ctx ??= new AudioContext({ latencyHint: "interactive" });
      if (ctx.state === "suspended") void ctx.resume();
    } catch {
      return undefined; // no sound on this device: the page works the same
    }
    return ctx;
  };

  const play = (name: SoundName, options: SoundOptions = {}): void => {
    if (!on) return;
    const context = wake();
    if (!context) return;
    if (kit) {
      kit.play(name, options);
      return;
    }
    void load().then((module) => {
      kit ??= module?.createKit(context);
      kit?.play(name, options);
    });
  };

  // An earlier visit left sound on: load the sounds when the page is idle, start the audio on the first press
  const unlockOnPress = () => {
    const unlock = () => {
      if (on) wake();
      for (const type of ["click", "keydown"] as const) document.removeEventListener(type, unlock, true);
    };
    for (const type of ["click", "keydown"] as const) document.addEventListener(type, unlock, true);
  };

  const show = () => {
    for (const button of switches) button.setAttribute("aria-pressed", String(on));
  };
  for (const button of switches) {
    button.addEventListener("click", () => {
      on = !on;
      store(on);
      show();
      if (on) play("select", { index: 2 });
      else void ctx?.suspend();
    });
  }
  show();
  if (on) {
    unlockOnPress();
    setTimeout(() => void load(), 1200);
  }

  return { play };
}
