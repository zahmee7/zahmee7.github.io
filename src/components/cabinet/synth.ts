// The drawer's sounds, drawn here in code sample by sample: no audio files to load or license
// (DESIGN.md > Sound). Loaded only once the visitor turns sound on (sound.ts).
// - drawer: the latch lets go, the drawer rolls out on ball-bearing rails, hits its stop and rebounds, and
//   the hanging folders settle. The roll follows the speed of the pull and the stop lands on its moment
//   (pull.ts gives the time).
// - select: a short flick of paper as a folder is picked out, a little higher for each folder forward.
// - open: a tap on the tab, then the page drawn out of the folder and up the screen (MOTION.md 3).
// - knock: two muted knocks on a locked folder.
// Each layer is scaled to a set peak, so every level below is a plain number and not a filter's gain.

export type SoundName = "drawer" | "select" | "open" | "knock";
export interface SoundOptions {
  hit?: number;
  reduce?: boolean;
  index?: number;
  turn?: number;
}

const RATE = 48000;

/** A small, fast random source with a seed, so each sound is drawn the same way every time. */
function seeded(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A second-order filter: low-pass, high-pass or band-pass. set() can move it while it runs. */
class Filter {
  private x1 = 0;
  private x2 = 0;
  private y1 = 0;
  private y2 = 0;
  private b0 = 0;
  private b1 = 0;
  private b2 = 0;
  private a1 = 0;
  private a2 = 0;

  constructor(
    private readonly type: "lp" | "hp" | "bp",
    freq: number,
    q = 0.707,
  ) {
    this.set(freq, q);
  }

  set(freq: number, q: number): void {
    const w = (2 * Math.PI * Math.min(freq, RATE * 0.45)) / RATE;
    const c = Math.cos(w);
    const alpha = Math.sin(w) / (2 * q);
    const a0 = 1 + alpha;
    const [b0, b1, b2] =
      this.type === "lp"
        ? [(1 - c) / 2, 1 - c, (1 - c) / 2]
        : this.type === "hp"
          ? [(1 + c) / 2, -(1 + c), (1 + c) / 2]
          : [alpha, 0, -alpha];
    this.b0 = b0 / a0;
    this.b1 = b1 / a0;
    this.b2 = b2 / a0;
    this.a1 = (-2 * c) / a0;
    this.a2 = (1 - alpha) / a0;
  }

  run(x: number): number {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1;
    this.x1 = x;
    this.y2 = this.y1;
    this.y1 = y;
    return y;
  }
}

function pinkNoise(random: () => number): () => number {
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  return () => {
    const white = random() * 2 - 1;
    b0 = 0.99765 * b0 + white * 0.099046;
    b1 = 0.963 * b1 + white * 0.2965164;
    b2 = 0.57 * b2 + white * 1.0526913;
    return (b0 + b1 + b2 + white * 0.1848) * 0.2;
  };
}

/** Draws a layer on its own, scales it to the given peak and adds it into out at a time (s). */
function layer(
  out: Float32Array,
  at: number,
  seconds: number,
  peak: number,
  draw: (d: Float32Array) => void,
): void {
  const data = new Float32Array(Math.ceil(seconds * RATE));
  draw(data);
  let max = 0;
  for (const v of data) max = Math.max(max, Math.abs(v));
  if (!max) return;
  const k = peak / max;
  const start = Math.round(at * RATE);
  for (let i = 0; i < data.length && start + i < out.length; i++) out[start + i]! += data[i]! * k;
}

/** A knock of wood or metal: a falling tone, driven a little so small speakers still hear it, and a click. */
function knock(
  out: Float32Array,
  at: number,
  peak: number,
  [from, to]: [number, number],
  decay: number,
  random: () => number,
): void {
  layer(out, at, decay * 8, peak, (d) => {
    const click = new Filter("lp", 1800);
    let phase = 0;
    for (let i = 0; i < d.length; i++) {
      const t = i / RATE;
      phase += (2 * Math.PI * (to + (from - to) * Math.exp(-t / 0.04))) / RATE;
      const tone = Math.tanh(1.6 * Math.sin(phase)) / Math.tanh(1.6);
      d[i] =
        tone * Math.min(1, t / 0.002) * Math.exp(-t / decay) +
        click.run(random() * 2 - 1) * 0.5 * Math.exp(-t / 0.004);
    }
  });
}

/** A struck body: a short burst of noise ringing through a few resonances [frequency, gain, decay]. */
function ring(
  out: Float32Array,
  at: number,
  peak: number,
  modes: Array<[number, number, number]>,
  random: () => number,
): void {
  layer(out, at, Math.max(...modes.map((mode) => mode[2])) * 6, peak, (d) => {
    const bank = modes.map(([f, gain, tau]) => ({ filter: new Filter("bp", f, Math.PI * f * tau), gain }));
    for (let i = 0; i < d.length; i++) {
      const x = i < 0.004 * RATE ? (random() * 2 - 1) * Math.exp(-i / (0.001 * RATE)) : 0;
      let y = 0;
      for (const mode of bank) y += mode.filter.run(x) * mode.gain;
      d[i] = y;
    }
  });
}

/** Paper: a crackle of small clicks, brightened and softened, shaped by an envelope over time (s). */
function paper(
  out: Float32Array,
  at: number,
  seconds: number,
  peak: number,
  envelope: (t: number) => number,
  random: () => number,
  tone: number,
): void {
  layer(out, at, seconds, peak, (d) => {
    const high = new Filter("hp", 1600);
    const band = new Filter("bp", tone, 0.8);
    const soft = new Filter("lp", 7000);
    for (let i = 0; i < d.length; i++) {
      const grain = random() < 0.18 ? (random() * 2 - 1) * (0.4 + random()) : (random() * 2 - 1) * 0.25;
      d[i] = soft.run(band.run(high.run(grain))) * envelope(i / RATE);
    }
  });
}

/** The page's speed as it is pulled up (ease "paper": cubic-bezier(0.2, 0.7, 0.2, 1)), from 0 to 1. */
const pageSpeed = (() => {
  const bezier = (s: number, p1: number, p2: number) =>
    3 * (1 - s) ** 2 * s * p1 + 3 * (1 - s) * s * s * p2 + s ** 3;
  const table: Array<[number, number]> = [];
  for (let k = 0; k <= 400; k++) {
    const s = k / 400;
    const dx = bezier(s + 1e-4, 0.2, 0.2) - bezier(s, 0.2, 0.2);
    const dy = bezier(s + 1e-4, 0.7, 1) - bezier(s, 0.7, 1);
    table.push([bezier(s, 0.2, 0.2), Math.max(0, dy / dx)]); // the last step overshoots s = 1
  }
  const top = Math.max(...table.map((row) => row[1]));
  return (u: number): number => {
    if (u <= 0 || u >= 1) return 0;
    let lo = 0;
    let hi = table.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (table[mid]![0] < u) lo = mid + 1;
      else hi = mid;
    }
    return table[lo]![1] / top;
  };
})();

function sound(seconds: number, draw: (out: Float32Array) => void): Float32Array<ArrayBuffer> {
  const out = new Float32Array(Math.ceil(seconds * RATE));
  draw(out);
  return out;
}

const makers: Record<SoundName, (options: SoundOptions) => Float32Array<ArrayBuffer>> = {
  drawer: ({ hit = 0.84, reduce = false }) => {
    const random = seeded(11);
    return sound(reduce ? 0.6 : hit + 1.2, (out) => {
      // the latch lets go
      knock(out, 0, 0.16, [190, 120], 0.03, random);
      ring(
        out,
        0.004,
        0.09,
        [
          [1870, 1, 0.03],
          [3120, 0.6, 0.02],
        ],
        random,
      );
      if (reduce) {
        knock(out, 0.09, 0.3, [110, 60], 0.07, random);
        return;
      }
      const start = 0.02;
      const speedAt = (i: number) => {
        const u = Math.min(1, i / RATE / hit);
        return {
          u,
          speed: Math.max(0, (4.8 * u - 4.2 * u * u) / 1.371),
          travelled: 2.4 * u * u - 1.4 * u ** 3,
        };
      };
      // the roll and a low rumble, both following the speed, cut off at the stop
      layer(out, start, hit + 0.05, 0.16, (d) => {
        const noise = pinkNoise(random);
        const roll = new Filter("bp", 500, 0.9);
        const rumble = new Filter("lp", 150);
        let brown = 0;
        for (let i = 0; i < d.length; i++) {
          const { u, speed } = speedAt(i);
          const cut = u < 1 ? 1 : Math.exp(-(i - hit * RATE) / (0.006 * RATE));
          if ((i & 31) === 0) roll.set(360 + 1000 * speed, 0.9);
          brown = (brown + 0.02 * (random() * 2 - 1)) / 1.02;
          d[i] = (roll.run(noise()) * speed ** 1.3 + rumble.run(brown * 3.5) * 0.9 * speed) * cut;
        }
      });
      // the bearings: a small metallic tick every few millimetres of travel
      layer(out, start, hit + 0.05, 0.075, (d) => {
        const bearing = new Filter("bp", 4200, 9);
        let next = 0.01;
        for (let i = 0; i < d.length; i++) {
          const { u, speed, travelled } = speedAt(i);
          let x = 0;
          if (u < 1 && travelled >= next) {
            x = (0.5 + 0.5 * random()) * (0.3 + 0.7 * speed);
            next += 0.009 + random() * 0.009;
            bearing.set(3400 + random() * 1600, 9);
          }
          d[i] = bearing.run(x);
        }
      });
      // the stop: a thud of the box, the ring of its metal, the rebound
      const stop = start + hit;
      knock(out, stop, 0.5, [118, 52], 0.09, random);
      ring(
        out,
        stop,
        0.2,
        [
          [182, 1, 0.26],
          [417, 0.8, 0.2],
          [941, 0.55, 0.14],
          [1663, 0.38, 0.1],
          [2688, 0.26, 0.07],
          [3977, 0.15, 0.045],
        ],
        random,
      );
      knock(out, stop + 0.125, 0.14, [95, 60], 0.05, random);
      // the hanging folders swing and settle
      const bumps = [
        [0.03, 1],
        [0.1, 0.7],
        [0.19, 0.5],
        [0.31, 0.28],
        [0.45, 0.14],
      ] as const;
      const rustle = (t: number) =>
        bumps.reduce((sum, [at, g]) => sum + g * Math.exp(-(((t - at) / 0.03) ** 2)), 0);
      paper(out, stop, 0.7, 0.09, rustle, random, 3600);
    });
  },

  select: ({ index = 0, turn = 0 }) => {
    const random = seeded(101 + index * 7 + turn);
    return sound(0.16, (out) => {
      const flick = (t: number) => Math.min(1, t / 0.003) * Math.exp(-t / 0.022);
      paper(out, 0, 0.14, 0.1, flick, random, 2800 + index * 260 + turn * 90);
      knock(out, 0, 0.025, [900 + index * 40, 700], 0.008, random);
    });
  },

  open: () => {
    const random = seeded(211);
    return sound(1.05, (out) => {
      knock(out, 0, 0.2, [210, 140], 0.028, random);
      // the page leaves 0.1 s after the press and takes 0.72 s (MOTION.md 3)
      const start = 0.1;
      const length = 0.72;
      const swish = (t: number) => Math.min(1, t / 0.025) * pageSpeed(t / length) ** 1.4;
      layer(out, start, length + 0.05, 0.16, (d) => {
        const noise = pinkNoise(random);
        const sweep = new Filter("bp", 800, 0.8);
        for (let i = 0; i < d.length; i++) {
          const t = i / RATE;
          if ((i & 31) === 0) sweep.set(800 * Math.pow(4.6, Math.min(1, t / length)), 0.8);
          d[i] = sweep.run(noise()) * swish(t);
        }
      });
      paper(out, start, length + 0.05, 0.075, swish, random, 5200);
    });
  },

  knock: () => {
    const random = seeded(307);
    return sound(0.4, (out) => {
      knock(out, 0, 0.22, [240, 175], 0.03, random);
      knock(out, 0.12, 0.15, [235, 170], 0.028, random);
    });
  },
};

/** A small room around the sounds, so they are not dry. */
function room(ctx: BaseAudioContext): ConvolverNode {
  const random = seeded(5);
  const length = Math.round(0.7 * RATE);
  const buffer = new AudioBuffer({ length, sampleRate: RATE, numberOfChannels: 2 });
  const reflections = [
    [
      [0.0071, 0.5],
      [0.0113, 0.38],
      [0.0167, 0.3],
      [0.0229, 0.22],
    ],
    [
      [0.0083, 0.45],
      [0.0131, 0.35],
      [0.0197, 0.28],
      [0.0261, 0.2],
    ],
  ] as const;
  reflections.forEach((early, channel) => {
    const data = new Float32Array(length);
    for (const [t, g] of early) data[Math.round(t * RATE)]! += g;
    let smooth = 0;
    for (let i = Math.round(0.012 * RATE); i < length; i++) {
      const t = i / RATE;
      smooth += (1 - Math.min(0.9, 0.35 + t)) * (random() * 2 - 1 - smooth);
      data[i]! += smooth * 0.5 * Math.exp(-t / 0.12);
    }
    buffer.copyToChannel(data, channel);
  });
  return new ConvolverNode(ctx, { buffer });
}

const buffers = new Map<string, AudioBuffer>();
function bufferOf(name: SoundName, options: SoundOptions): AudioBuffer {
  const key = `${name}:${JSON.stringify(options)}`;
  let buffer = buffers.get(key);
  if (!buffer) {
    const data = makers[name](options);
    buffer = new AudioBuffer({ length: data.length, sampleRate: RATE, numberOfChannels: 1 });
    buffer.copyToChannel(data, 0);
    buffers.set(key, buffer);
  }
  return buffer;
}

/** Draws sounds ahead, so a press never waits for one. */
export function warm(list: Array<[SoundName, SoundOptions]>): void {
  for (const [name, options] of list) bufferOf(name, options);
}

export interface Kit {
  play(name: SoundName, options?: SoundOptions): void;
}

export function createKit(ctx: AudioContext): Kit {
  const input = new GainNode(ctx, { gain: 0.62 });
  const wet = new GainNode(ctx, { gain: 0.22 });
  const limiter = new DynamicsCompressorNode(ctx, {
    threshold: -8,
    knee: 6,
    ratio: 4,
    attack: 0.002,
    release: 0.12,
  });
  input.connect(limiter);
  input.connect(room(ctx)).connect(wet).connect(limiter);
  limiter.connect(ctx.destination);
  return {
    play(name, options = {}) {
      const source = new AudioBufferSourceNode(ctx, { buffer: bufferOf(name, options) });
      source.connect(input);
      source.start();
    },
  };
}
