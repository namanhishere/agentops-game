/** Web Audio synthesis — no assets. All sounds are generated on the fly. */

type OscType = OscillatorType;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const AC =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.15;
      master.connect(ctx.destination);
    }
    return ctx;
  } catch {
    return null; // no audio device in this environment — stay silent
  }
}

function unlocked(): boolean {
  const c = ensureCtx();
  if (!c || muted) return false;
  if (c.state === "suspended") {
    void c.resume();
  }
  return c.state === "running";
}

interface BeepOpts {
  freq: number;
  dur: number;
  type?: OscType;
  gain?: number;
  slideTo?: number;
  delay?: number;
}

function beep({ freq, dur, type = "sine", gain = 1, slideTo, delay = 0 }: BeepOpts): void {
  if (!unlocked() || !ctx || !master) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  // 5ms attack + exponential decay
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export function setMuted(v: boolean): void {
  muted = v;
}

export const sfx = {
  setMuted,
  get muted(): boolean {
    return muted;
  },
  click: () => beep({ freq: 600, dur: 0.06, type: "square", gain: 0.3 }),
  assign: () => beep({ freq: 440, dur: 0.12, type: "triangle", gain: 0.5, slideTo: 660 }),
  success: () => {
    beep({ freq: 523.25, dur: 0.08, gain: 0.5 });
    beep({ freq: 659.25, dur: 0.08, gain: 0.5, delay: 0.08 });
    beep({ freq: 783.99, dur: 0.09, gain: 0.55, delay: 0.16 });
  },
  failure: () => {
    beep({ freq: 150, dur: 0.3, type: "sawtooth", gain: 0.5 });
    beep({ freq: 90, dur: 0.3, type: "sawtooth", gain: 0.4, delay: 0.02 });
  },
  levelup: () => {
    const notes = [523.25, 587.33, 659.25, 783.99];
    notes.forEach((f, i) => beep({ freq: f, dur: 0.09, gain: 0.5, delay: i * 0.09 }));
  },
  cash: () => beep({ freq: 880, dur: 0.1, slideTo: 1320, gain: 0.4 }),
  warning: () => {
    beep({ freq: 400, dur: 0.1, type: "square", gain: 0.35 });
    beep({ freq: 400, dur: 0.1, type: "square", gain: 0.35, delay: 0.14 });
  },
  gameover: () => {
    const notes = [440, 349.23, 293.66];
    notes.forEach((f, i) =>
      beep({ freq: f, dur: 0.32, type: "triangle", gain: 0.45, delay: i * 0.34 }),
    );
  },
  victory: () => {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568];
    notes.forEach((f, i) => beep({ freq: f, dur: 0.11, gain: 0.5, delay: i * 0.1 }));
  },
  buy: () => beep({ freq: 988, dur: 0.08, type: "square", gain: 0.35, slideTo: 1319 }),
};
