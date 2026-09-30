// Variant · sounds for the drawer (use with ?v=pull,sound). Four sounds:
// - the drawer pulled open: the latch, the slide on ball-bearing rails, the stop, the folders settling;
// - a folder picked out, under the mouse or the keyboard focus: a short flick of paper;
// - a folder opened: a tap on the tab, then the page drawn out with a swish;
// - a locked folder: two muted knocks.
// Every sound is drawn here in code, sample by sample: no audio files to load or license. The slide's
// speed and the moment of the stop come from v-pull.js, so the sound follows the motion. A button by the
// language switch turns the sounds off; the choice is kept in this browser. Browsers allow sound only
// after the visitor presses something, and the first press here is the one that opens the drawer.
(() => {
  const root = document.documentElement;
  const drawer = document.querySelector(".drawer");
  if (!drawer) return;
  const ar = root.lang === "ar";
  const RATE = 48000;

  // ---------- Signal helpers ----------
  const seeded = (seed) => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // A second-order filter (low-pass, high-pass or band-pass); set() can move it while it runs
  class Filter {
    constructor(type, freq, q = 0.707) {
      this.type = type;
      this.x1 = this.x2 = this.y1 = this.y2 = 0;
      this.set(freq, q);
    }
    set(freq, q = this.q) {
      this.q = q;
      const w = (2 * Math.PI * Math.min(freq, RATE * 0.45)) / RATE;
      const c = Math.cos(w);
      const alpha = Math.sin(w) / (2 * q);
      const a0 = 1 + alpha;
      let b0, b1, b2;
      if (this.type === "lp") [b0, b1, b2] = [(1 - c) / 2, 1 - c, (1 - c) / 2];
      else if (this.type === "hp") [b0, b1, b2] = [(1 + c) / 2, -(1 + c), (1 + c) / 2];
      else [b0, b1, b2] = [alpha, 0, -alpha];
      this.b0 = b0 / a0;
      this.b1 = b1 / a0;
      this.b2 = b2 / a0;
      this.a1 = (-2 * c) / a0;
      this.a2 = (1 - alpha) / a0;
    }
    run(x) {
      const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
      this.x2 = this.x1;
      this.x1 = x;
      this.y2 = this.y1;
      this.y1 = y;
      return y;
    }
  }

  const pinkNoise = (rnd) => {
    let b0 = 0, b1 = 0, b2 = 0;
    return () => {
      const w = rnd() * 2 - 1;
      b0 = 0.99765 * b0 + w * 0.099046;
      b1 = 0.963 * b1 + w * 0.2965164;
      b2 = 0.57 * b2 + w * 1.0526913;
      return (b0 + b1 + b2 + w * 0.1848) * 0.2;
    };
  };

  // A layer is drawn into its own array, then scaled to a set peak and added in at a time, so every
  // level below is a plain number and not the side effect of a filter's gain.
  const layer = (out, at, seconds, peak, draw) => {
    const data = new Float32Array(Math.ceil(seconds * RATE));
    draw(data);
    let max = 0;
    for (const v of data) max = Math.max(max, Math.abs(v));
    if (!max) return;
    const k = peak / max;
    const start = Math.round(at * RATE);
    for (let i = 0; i < data.length && start + i < out.length; i++) out[start + i] += data[i] * k;
  };
  const sound = (seconds, draw) => {
    const out = new Float32Array(Math.ceil(seconds * RATE));
    draw(out);
    return out;
  };

  // A knock of wood or metal: a falling tone and a short click
  const knock = (out, at, peak, from, to, decay, rnd) =>
    layer(out, at, decay * 8, peak, (d) => {
      const click = new Filter("lp", 1800);
      let phase = 0;
      for (let i = 0; i < d.length; i++) {
        const t = i / RATE;
        const f = to + (from - to) * Math.exp(-t / 0.04);
        phase += (2 * Math.PI * f) / RATE;
        const attack = Math.min(1, t / 0.002);
        // a little drive adds overtones, so phone speakers that cannot play the low tone still hear it
        const tone = Math.tanh(1.6 * Math.sin(phase)) / Math.tanh(1.6);
        d[i] = tone * attack * Math.exp(-t / decay) + click.run(rnd() * 2 - 1) * 0.5 * Math.exp(-t / 0.004);
      }
    });

  // A struck body: a noise burst ringing through a few resonances
  const ring = (out, at, peak, modes, rnd) =>
    layer(out, at, Math.max(...modes.map((m) => m[2])) * 6, peak, (d) => {
      const bank = modes.map(([f, gain, tau]) => ({ filter: new Filter("bp", f, Math.PI * f * tau), gain }));
      for (let i = 0; i < d.length; i++) {
        const x = i < 0.004 * RATE ? (rnd() * 2 - 1) * Math.exp(-i / (0.001 * RATE)) : 0;
        let y = 0;
        for (const m of bank) y += m.filter.run(x) * m.gain;
        d[i] = y;
      }
    });

  // Paper: a crackle of small clicks, brightened, shaped by an envelope
  const paper = (out, at, seconds, peak, envelope, rnd, tone = 4200) =>
    layer(out, at, seconds, peak, (d) => {
      const hp = new Filter("hp", 1600);
      const bp = new Filter("bp", tone, 0.8);
      const soft = new Filter("lp", 7000);
      for (let i = 0; i < d.length; i++) {
        const e = envelope(i / RATE);
        const grain = rnd() < 0.18 ? (rnd() * 2 - 1) * (0.4 + rnd()) : (rnd() * 2 - 1) * 0.25;
        d[i] = soft.run(bp.run(hp.run(grain))) * e;
      }
    });

  // The speed of the page as it is pulled up (ease "paper": cubic-bezier(0.2, 0.7, 0.2, 1)), 0 to 1
  const pullSpeed = (() => {
    const table = [];
    const bez = (s, p1, p2) => 3 * (1 - s) ** 2 * s * p1 + 3 * (1 - s) * s * s * p2 + s ** 3;
    for (let k = 0; k <= 400; k++) {
      const s = k / 400;
      const ds = 1e-4;
      const dx = bez(s + ds, 0.2, 0.2) - bez(s, 0.2, 0.2);
      const dy = bez(s + ds, 0.7, 1) - bez(s, 0.7, 1);
      table.push([bez(s, 0.2, 0.2), Math.max(0, dy / dx)]); // the last step overshoots s = 1
    }
    const top = Math.max(...table.map((r) => r[1]));
    return (u) => {
      if (u <= 0 || u >= 1) return 0;
      let lo = 0;
      let hi = table.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (table[mid][0] < u) lo = mid + 1;
        else hi = mid;
      }
      return table[lo][1] / top;
    };
  })();

  // ---------- The sounds ----------
  const makers = {
    // The drawer: hit is when it reaches the stop, in seconds after the press
    drawer({ hit = 0.84, reduce = false }) {
      const rnd = seeded(11);
      return sound(reduce ? 0.6 : hit + 1.2, (out) => {
        // the latch lets go
        knock(out, 0, 0.16, 190, 120, 0.03, rnd);
        ring(out, 0.004, 0.09, [[1870, 1, 0.03], [3120, 0.6, 0.02]], rnd);
        if (reduce) {
          knock(out, 0.09, 0.3, 110, 60, 0.07, rnd);
          return;
        }
        // the slide: rolling noise and a low rumble that follow the speed, bearings ticking past
        const t0 = 0.02;
        layer(out, t0, hit + 0.05, 0.16, (d) => {
          const pink = pinkNoise(rnd);
          const roll = new Filter("bp", 500, 0.9);
          const rumble = new Filter("lp", 150);
          let brown = 0;
          for (let i = 0; i < d.length; i++) {
            const u = Math.min(1, i / RATE / hit);
            const speed = Math.max(0, (4.8 * u - 4.2 * u * u) / 1.371);
            const cut = u < 1 ? 1 : Math.exp(-(i - hit * RATE) / (0.006 * RATE));
            if ((i & 31) === 0) roll.set(360 + 1000 * speed, 0.9);
            brown = (brown + 0.02 * (rnd() * 2 - 1)) / 1.02;
            d[i] = (roll.run(pink()) * speed ** 1.3 + rumble.run(brown * 3.5) * 0.9 * speed) * cut;
          }
        });
        layer(out, t0, hit + 0.05, 0.075, (d) => {
          const bearing = new Filter("bp", 4200, 9);
          let next = 0.01;
          for (let i = 0; i < d.length; i++) {
            const u = Math.min(1, i / RATE / hit);
            const pos = 2.4 * u * u - 1.4 * u ** 3;
            const speed = Math.max(0, (4.8 * u - 4.2 * u * u) / 1.371);
            let x = 0;
            if (u < 1 && pos >= next) {
              x = (0.5 + 0.5 * rnd()) * (0.3 + 0.7 * speed);
              next += 0.009 + rnd() * 0.009;
              bearing.set(3400 + rnd() * 1600, 9);
            }
            d[i] = bearing.run(x);
          }
        });
        // the stop: a thud of the box, the ring of its metal, the rebound
        const stop = t0 + hit;
        knock(out, stop, 0.5, 118, 52, 0.09, rnd);
        ring(out, stop, 0.2, [[182, 1, 0.26], [417, 0.8, 0.2], [941, 0.55, 0.14], [1663, 0.38, 0.1], [2688, 0.26, 0.07], [3977, 0.15, 0.045]], rnd);
        knock(out, stop + 0.125, 0.14, 95, 60, 0.05, rnd);
        // the hanging folders swing on their rails and settle
        const bumps = [[0.03, 1], [0.1, 0.7], [0.19, 0.5], [0.31, 0.28], [0.45, 0.14]];
        paper(out, stop, 0.7, 0.09, (t) => bumps.reduce((sum, [at, g]) => sum + g * Math.exp(-(((t - at) / 0.03) ** 2)), 0), rnd, 3600);
      });
    },

    // A folder picked out: a flick of paper, a little higher for each folder further forward
    select({ i = 0, v = 0 }) {
      const rnd = seeded(101 + i * 7 + v);
      return sound(0.16, (out) => {
        paper(out, 0, 0.14, 0.1, (t) => Math.min(1, t / 0.003) * Math.exp(-t / 0.022), rnd, 2800 + i * 260 + v * 90);
        knock(out, 0, 0.025, 900 + i * 40, 700, 0.008, rnd);
      });
    },

    // A folder opened: the tap on the tab, then the page drawn out of the folder and up the screen
    open() {
      const rnd = seeded(211);
      return sound(1.05, (out) => {
        knock(out, 0, 0.2, 210, 140, 0.028, rnd);
        const start = 0.1;
        const length = 0.72;
        const envelope = (t) => {
          const u = t / length;
          return Math.min(1, t / 0.025) * pullSpeed(u) ** 1.4;
        };
        layer(out, start, length + 0.05, 0.16, (d) => {
          const noise = pinkNoise(rnd);
          const sweep = new Filter("bp", 800, 0.8);
          for (let i = 0; i < d.length; i++) {
            const t = i / RATE;
            if ((i & 31) === 0) sweep.set(800 * Math.pow(4.6, Math.min(1, t / length)), 0.8);
            d[i] = sweep.run(noise()) * envelope(t);
          }
        });
        paper(out, start, length + 0.05, 0.075, envelope, rnd, 5200);
      });
    },

    // A locked folder: two muted knocks
    knock() {
      const rnd = seeded(307);
      return sound(0.4, (out) => {
        knock(out, 0, 0.22, 240, 175, 0.03, rnd);
        knock(out, 0.12, 0.15, 235, 170, 0.028, rnd);
      });
    },
  };

  // A small room around the sounds, so they are not dry
  const roomFor = (ctx) => {
    const rnd = seeded(5);
    const length = Math.round(0.7 * RATE);
    const buffer = new AudioBuffer({ length, sampleRate: RATE, numberOfChannels: 2 });
    for (let ch = 0; ch < 2; ch++) {
      const data = new Float32Array(length);
      const early = ch ? [[0.0083, 0.45], [0.0131, 0.35], [0.0197, 0.28], [0.0261, 0.2]] : [[0.0071, 0.5], [0.0113, 0.38], [0.0167, 0.3], [0.0229, 0.22]];
      for (const [t, g] of early) data[Math.round(t * RATE)] += g;
      let smooth = 0;
      for (let i = Math.round(0.012 * RATE); i < length; i++) {
        const t = i / RATE;
        smooth += (1 - Math.min(0.9, 0.35 + t)) * ((rnd() * 2 - 1) - smooth);
        data[i] += smooth * 0.5 * Math.exp(-t / 0.12);
      }
      buffer.copyToChannel(data, ch);
    }
    const convolver = new ConvolverNode(ctx, { buffer });
    return convolver;
  };
  const busFor = (ctx) => {
    const input = new GainNode(ctx, { gain: 0.62 });
    const wet = new GainNode(ctx, { gain: 0.22 });
    const limiter = new DynamicsCompressorNode(ctx, { threshold: -8, knee: 6, ratio: 4, attack: 0.002, release: 0.12 });
    const room = roomFor(ctx);
    input.connect(limiter);
    input.connect(room).connect(wet).connect(limiter);
    limiter.connect(ctx.destination);
    return input;
  };

  const cache = new Map();
  const bufferOf = (name, opts = {}) => {
    const key = `${name}:${JSON.stringify(opts)}`;
    if (!cache.has(key)) {
      const data = makers[name](opts);
      const buffer = new AudioBuffer({ length: data.length, sampleRate: RATE, numberOfChannels: 1 });
      buffer.copyToChannel(data, 0);
      cache.set(key, buffer);
    }
    return cache.get(key);
  };

  // ---------- Playing, and the switch ----------
  const store = {
    get: () => {
      try {
        return localStorage.getItem("cabinet-sound") !== "off";
      } catch {
        return true;
      }
    },
    set: (value) => {
      try {
        localStorage.setItem("cabinet-sound", value ? "on" : "off");
      } catch {
        /* the switch still works for this visit */
      }
    },
  };
  let on = store.get();
  let ctx;
  let bus;
  const log = [];
  const play = (name, opts = {}) => {
    if (!on) return;
    log.push({ name, opts, at: Date.now() });
    try {
      if (!ctx) {
        ctx = new AudioContext({ latencyHint: "interactive" });
        bus = busFor(ctx);
      }
      if (ctx.state === "suspended") void ctx.resume();
      const source = new AudioBufferSourceNode(ctx, { buffer: bufferOf(name, opts) });
      source.connect(bus);
      source.start();
    } catch {
      /* no sound on this device: the page works the same */
    }
  };

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "btn sound-toggle";
  toggle.setAttribute("aria-label", ar ? "أصوات الدرج" : "Drawer sounds");
  toggle.title = ar ? "أصوات الدرج" : "Drawer sounds";
  toggle.setAttribute("aria-pressed", String(on));
  toggle.innerHTML =
    '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/>' +
    '<path class="sound-toggle__on" d="M15.5 9a4 4 0 0 1 0 6M18.2 6.5a7.6 7.6 0 0 1 0 11"/>' +
    '<path class="sound-toggle__off" d="M16 9.5l5 5M21 9.5l-5 5"/></svg>';
  toggle.addEventListener("click", () => {
    on = !on;
    store.set(on);
    toggle.setAttribute("aria-pressed", String(on));
    play("select", { i: 2, v: 0 });
  });
  // Beside the language switch on wide screens; on phones the masthead is full, so it moves to the end of
  // the kicker line above the title
  const narrow = matchMedia("(max-width: 899px)");
  const place = () => {
    const spot = narrow.matches ? document.querySelector(".hero__grid") : document.querySelector(".masthead__nav");
    if (spot && toggle.parentElement !== spot) spot.append(toggle);
  };
  place();
  narrow.addEventListener("change", place);

  // ---------- When they play ----------
  // Folders are quiet until the drawer is out (v-pull.js); without that variant they are out from the start
  let ready = !drawer.querySelector(".drawer__opener");
  document.addEventListener("cabinet:pull", (event) => {
    const { hit, reduce } = event.detail ?? {};
    play("drawer", reduce ? { reduce: true } : { hit });
    setTimeout(() => (ready = true), reduce ? 0 : (hit + 0.5) * 1000);
  });

  // Draw the sounds ahead, once the page is idle, so a press never waits for one
  setTimeout(() => {
    const hit = parseFloat(drawer.dataset.pullHit ?? "");
    if (hit) bufferOf("drawer", { hit });
    bufferOf("open");
    bufferOf("knock");
    drawer.querySelectorAll(".folder").forEach((_, i) => [0, 1, 2].forEach((v) => bufferOf("select", { i, v })));
  }, 900);

  let last = 0;
  let turn = 0;
  const select = (i) => {
    const now = performance.now();
    if (!ready || now - last < 70 || document.querySelector("dialog[open]")) return;
    last = now;
    turn = (turn + 1) % 3;
    play("select", { i, v: turn });
  };
  for (const [i, folder] of [...drawer.querySelectorAll(".folder")].entries()) {
    folder.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "mouse") select(i);
    });
    folder.addEventListener("focusin", (event) => {
      if (event.target instanceof Element && event.target.matches(":focus-visible")) select(i);
    });
    folder.querySelector(".folder__sheet")?.addEventListener("click", () => {
      play(folder.hasAttribute("data-locked") ? "knock" : "open");
    });
  }

  // For recordings of this variant: renders what was played to a WAV file, t0 being the video's start
  window.__cabinetSound = {
    log,
    async render(t0, seconds) {
      const offline = new OfflineAudioContext({ numberOfChannels: 2, length: Math.ceil(seconds * RATE), sampleRate: RATE });
      const offlineBus = busFor(offline);
      for (const entry of log) {
        const source = new AudioBufferSourceNode(offline, { buffer: bufferOf(entry.name, entry.opts) });
        source.connect(offlineBus);
        source.start(Math.max(0, (entry.at - t0) / 1000));
      }
      const audio = await offline.startRendering();
      const frames = audio.length;
      const bytes = new DataView(new ArrayBuffer(44 + frames * 4));
      const text = (at, s) => [...s].forEach((c, k) => bytes.setUint8(at + k, c.charCodeAt(0)));
      text(0, "RIFF");
      bytes.setUint32(4, 36 + frames * 4, true);
      text(8, "WAVEfmt ");
      bytes.setUint32(16, 16, true);
      bytes.setUint16(20, 1, true);
      bytes.setUint16(22, 2, true);
      bytes.setUint32(24, RATE, true);
      bytes.setUint32(28, RATE * 4, true);
      bytes.setUint16(32, 4, true);
      bytes.setUint16(34, 16, true);
      text(36, "data");
      bytes.setUint32(40, frames * 4, true);
      const left = audio.getChannelData(0);
      const right = audio.getChannelData(1);
      for (let i = 0; i < frames; i++) {
        bytes.setInt16(44 + i * 4, Math.max(-1, Math.min(1, left[i])) * 32767, true);
        bytes.setInt16(46 + i * 4, Math.max(-1, Math.min(1, right[i])) * 32767, true);
      }
      const raw = new Uint8Array(bytes.buffer);
      let binary = "";
      for (let k = 0; k < raw.length; k += 32768) binary += String.fromCharCode(...raw.subarray(k, k + 32768));
      return btoa(binary);
    },
  };
})();
