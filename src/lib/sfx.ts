import { useSyncExternalStore } from "react";

export type SfxName =
  | "tap"
  | "draw"
  | "loop"
  | "cracked"
  | "miss"
  | "legitHit"
  | "lineBreak"
  | "noBandwidth"
  | "deliver"
  | "breach"
  | "trojan"
  | "split"
  | "zeroDay"
  | "vpn"
  | "killSwitch"
  | "honeypot"
  | "win"
  | "whoosh"
  | "reveal"
  | "lost"
  | "star"
  | "buy"
  | "equip"
  | "pick"
  | "install"
  | "reroll"
  | "zone"
  | "locked"
  | "unlock"
  | "briefing"
  | "shutdown"
  | "play"
  | "codex"
  | "page"
  | "zones"
  | "shop"
  | "wave"
  | "settings"
  | "hurt"
  | "glitch";

const KEY = "netloop.sound.v1";
const VOLUME_KEY = "netloop.volume.v1";
const DEFAULT_VOLUME = 0.7;
const MASTER_GAIN = 1.4;
const MIN_GAP_MS: Partial<Record<SfxName, number>> = { wave: 500, deliver: 70, draw: 120, noBandwidth: 400, tap: 40 };

let enabled = true;
let volume = DEFAULT_VOLUME;
let master: GainNode | null = null;
let loaded = false;
let ctx: AudioContext | null = null;
let bus: AudioNode | null = null;
let dry: GainNode | null = null;
let wet: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
const lastPlayed = new Map<SfxName, number>();
const listeners = new Set<() => void>();

function loadSetting() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    enabled = window.localStorage.getItem(KEY) !== "off";
    const stored = Number(window.localStorage.getItem(VOLUME_KEY));
    volume = window.localStorage.getItem(VOLUME_KEY) !== null && Number.isFinite(stored) ? Math.min(1, Math.max(0, stored)) : DEFAULT_VOLUME;
  } catch {
    enabled = true;
  }
}

export function roomImpulse(ac: AudioContext, seconds: number) {
  const len = Math.floor(ac.sampleRate * seconds);
  const buf = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  }
  return buf;
}

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.ratio.value = 3;
    const warm = ctx.createBiquadFilter();
    warm.type = "lowpass";
    warm.frequency.value = 5200;
    warm.connect(comp).connect(ctx.destination);
    bus = warm;
    master = ctx.createGain();
    master.gain.value = volume * volume * MASTER_GAIN;
    master.connect(bus);
    dry = ctx.createGain();
    dry.connect(master);
    const room = ctx.createConvolver();
    room.buffer = roomImpulse(ctx, 1.6);
    wet = ctx.createGain();
    wet.gain.value = 0.32;
    wet.connect(room).connect(master);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function audioGraph(): { ctx: AudioContext; bus: AudioNode } | null {
  const ac = audio();
  return ac && bus ? { ctx: ac, bus } : null;
}

export function onUserGesture(fn: () => void) {
  if (typeof window === "undefined") return () => {};
  const run = () => {
    window.removeEventListener("pointerdown", run);
    window.removeEventListener("keydown", run);
    fn();
  };
  window.addEventListener("pointerdown", run);
  window.addEventListener("keydown", run);
  return () => {
    window.removeEventListener("pointerdown", run);
    window.removeEventListener("keydown", run);
  };
}

function out(node: AudioNode, send = 1) {
  node.connect(dry!);
  if (send > 0) {
    const s = node.context.createGain();
    s.gain.value = send;
    node.connect(s).connect(wet!);
  }
}

type PluckOpts = {
  freq: number;
  at?: number;
  dur?: number;
  vol?: number;
  type?: OscillatorType;
  bend?: number;
  bright?: number;
  attack?: number;
  send?: number;
};

function pluck(ac: AudioContext, { freq, at = 0, dur = 0.22, vol = 0.22, type = "triangle", bend = 1, bright = 2600, attack = 0.004, send = 1 }: PluckOpts) {
  const t = ac.currentTime + at;
  const osc = ac.createOscillator();
  const filter = ac.createBiquadFilter();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (bend !== 1) osc.frequency.exponentialRampToValueAtTime(freq * bend, t + dur * 0.6);
  filter.type = "lowpass";
  filter.Q.value = 2;
  filter.frequency.setValueAtTime(bright, t);
  filter.frequency.exponentialRampToValueAtTime(Math.max(180, freq * 1.2), t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(filter).connect(gain);
  out(gain, send);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

function yelp(ac: AudioContext, at: number, from: number, peak: number, to: number, dur: number, vol: number) {
  const t = ac.currentTime + at;
  const osc = ac.createOscillator();
  const wobble = ac.createOscillator();
  const depth = ac.createGain();
  const formant = ac.createBiquadFilter();
  const gain = ac.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(peak, t + dur * 0.18);
  osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  wobble.frequency.value = 22;
  depth.gain.value = peak * 0.03;
  wobble.connect(depth).connect(osc.frequency);
  formant.type = "bandpass";
  formant.frequency.setValueAtTime(1300, t);
  formant.frequency.exponentialRampToValueAtTime(700, t + dur);
  formant.Q.value = 1.4;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  gain.gain.setValueAtTime(vol, t + dur * 0.5);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(formant).connect(gain);
  out(gain, 0.3);
  osc.start(t);
  wobble.start(t);
  osc.stop(t + dur + 0.05);
  wobble.stop(t + dur + 0.05);
}

function bell(ac: AudioContext, freq: number, at = 0, dur = 0.6, vol = 0.12) {
  pluck(ac, { freq, at, dur, vol, type: "sine", bright: 8000, send: 1.4 });
  pluck(ac, { freq: freq * 2.76, at, dur: dur * 0.4, vol: vol * 0.25, type: "sine", bright: 9000, send: 1.4 });
}

function noise(ac: AudioContext, { at = 0, dur, vol = 0.2, freq = 1800, to, q = 0.8, type = "bandpass", send = 0.6, attack = 0.003 }: { at?: number; dur: number; vol?: number; freq?: number; to?: number; q?: number; type?: BiquadFilterType; send?: number; attack?: number }) {
  if (!noiseBuffer) {
    noiseBuffer = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const t = ac.currentTime + at;
  const src = ac.createBufferSource();
  const filter = ac.createBiquadFilter();
  const gain = ac.createGain();
  src.buffer = noiseBuffer;
  filter.type = type;
  filter.Q.value = q;
  filter.frequency.setValueAtTime(freq, t);
  if (to) filter.frequency.exponentialRampToValueAtTime(to, t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter).connect(gain);
  out(gain, send);
  src.start(t);
  src.stop(t + dur + 0.05);
}

function pad(ac: AudioContext, freqs: number[], at: number, dur: number, vol: number) {
  const t = ac.currentTime + at;
  const filter = ac.createBiquadFilter();
  const gain = ac.createGain();
  const lfo = ac.createOscillator();
  const depth = ac.createGain();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(3200, t);
  filter.frequency.exponentialRampToValueAtTime(700, t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.03);
  gain.gain.setValueAtTime(vol, t + dur * 0.35);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  lfo.frequency.value = 9;
  depth.gain.value = vol * 0.35;
  lfo.connect(depth).connect(gain.gain);
  filter.connect(gain);
  out(gain, 1.3);
  for (const f of freqs) {
    for (const detune of [-7, 7]) {
      const osc = ac.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = f;
      osc.detune.value = detune;
      osc.connect(filter);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    }
  }
  lfo.start(t);
  lfo.stop(t + dur + 0.05);
}

function powerDown(ac: AudioContext, at: number, dur: number) {
  const t = ac.currentTime + at;
  const osc = ac.createOscillator();
  const sub = ac.createOscillator();
  const filter = ac.createBiquadFilter();
  const gain = ac.createGain();
  osc.type = "sawtooth";
  sub.type = "sine";
  osc.frequency.setValueAtTime(220, t);
  osc.frequency.exponentialRampToValueAtTime(28, t + dur);
  sub.frequency.setValueAtTime(110, t);
  sub.frequency.exponentialRampToValueAtTime(20, t + dur);
  filter.type = "lowpass";
  filter.Q.value = 4;
  filter.frequency.setValueAtTime(2200, t);
  filter.frequency.exponentialRampToValueAtTime(90, t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.2, t + 0.04);
  gain.gain.setValueAtTime(0.2, t + dur * 0.5);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(filter);
  sub.connect(filter);
  filter.connect(gain);
  out(gain, 0.6);
  osc.start(t);
  sub.start(t);
  osc.stop(t + dur + 0.05);
  sub.stop(t + dur + 0.05);
}

function swell(ac: AudioContext, at: number, dur: number) {
  const t = ac.currentTime + at;
  const osc = ac.createOscillator();
  const filter = ac.createBiquadFilter();
  const gain = ac.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(110, t);
  osc.frequency.exponentialRampToValueAtTime(262, t + dur);
  filter.type = "lowpass";
  filter.Q.value = 6;
  filter.frequency.setValueAtTime(220, t);
  filter.frequency.exponentialRampToValueAtTime(1400, t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.22, t + dur * 0.92);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.08);
  osc.connect(filter).connect(gain);
  out(gain, 0.8);
  osc.start(t);
  osc.stop(t + dur + 0.1);
  noise(ac, { at, dur: dur + 0.05, vol: 0.12, freq: 300, to: 2400, q: 1.2, attack: dur * 0.9, send: 1 });
}

const N = { E3: 164.8, Fs3: 185, A3: 220, B3: 247, Cs4: 277.2, E4: 329.6, F4: 349.2, Fs4: 370, Gs4: 415.3, A4: 440, B4: 493.9, Cs5: 554.4, E5: 659.3, F5: 698.5, Gs5: 830.6, A5: 880, B5: 987.8, Cs6: 1108.7, D6: 1174.7 };

const Sounds: Record<SfxName, (ac: AudioContext, level: number) => void> = {
  tap: (ac) => pluck(ac, { freq: N.A4, bend: 0.94, dur: 0.12, vol: 0.16, send: 0.4 }),
  draw: (ac) => {
    pluck(ac, { freq: N.E3, bend: 1.12, dur: 0.14, vol: 0.2, type: "sine" });
    noise(ac, { dur: 0.04, vol: 0.05, freq: 3000, q: 2, send: 0 });
  },
  loop: (ac, combo) => {
    const lift = Math.pow(2, (Math.min(combo, 5) - 1) * (2 / 12));
    pluck(ac, { freq: N.Cs4 * lift, dur: 0.2, vol: 0.2 });
    pluck(ac, { freq: N.Gs4 * lift, at: 0.05, dur: 0.24, vol: 0.18 });
    bell(ac, N.Cs5 * lift, 0.1, 0.4, 0.1);
    noise(ac, { dur: 0.1, vol: 0.06, freq: 900, to: 300, send: 0.3 });
  },
  cracked: (ac) => {
    pluck(ac, { freq: N.A3, bend: 0.8, dur: 0.14, vol: 0.22, type: "square", bright: 1200 });
    noise(ac, { dur: 0.07, vol: 0.12, freq: 2600, q: 3 });
  },
  miss: (ac) => pluck(ac, { freq: N.Fs3, bend: 0.85, dur: 0.16, vol: 0.14, type: "sine" }),
  legitHit: (ac) => {
    pluck(ac, { freq: N.F4, bend: 0.9, dur: 0.16, vol: 0.18, type: "square", bright: 900 });
    pluck(ac, { freq: N.B3, bend: 0.85, at: 0.13, dur: 0.26, vol: 0.18, type: "square", bright: 700 });
  },
  lineBreak: (ac) => {
    noise(ac, { dur: 0.2, vol: 0.16, freq: 2600, to: 300, q: 1.4 });
    pluck(ac, { freq: N.E4, bend: 0.5, dur: 0.2, vol: 0.14, bright: 1500 });
  },
  noBandwidth: (ac) => pluck(ac, { freq: N.E3, bend: 0.9, dur: 0.14, vol: 0.14, type: "square", bright: 600 }),
  deliver: (ac) => bell(ac, N.E5, 0, 0.25, 0.06),
  breach: (ac) => {
    pluck(ac, { freq: 98, bend: 0.5, dur: 0.4, vol: 0.4, type: "sine", bright: 800 });
    noise(ac, { dur: 0.3, vol: 0.16, freq: 420, to: 120, type: "lowpass", send: 0.4 });
    pluck(ac, { freq: N.Fs3, bend: 0.7, at: 0.03, dur: 0.22, vol: 0.12, type: "square", bright: 700 });
  },
  trojan: (ac) => {
    pluck(ac, { freq: N.B3, bend: 1.5, dur: 0.12, vol: 0.15 });
    noise(ac, { at: 0.08, dur: 0.2, vol: 0.12, freq: 900, to: 260 });
  },
  split: (ac) => {
    pluck(ac, { freq: N.E4, dur: 0.12, vol: 0.14 });
    pluck(ac, { freq: N.B3, at: 0.06, dur: 0.14, vol: 0.14 });
  },
  zeroDay: (ac) => pluck(ac, { freq: N.B4, bend: 0.4, dur: 0.16, vol: 0.13, type: "sawtooth", bright: 1600 }),
  vpn: (ac) => {
    bell(ac, N.A5, 0, 0.35, 0.09);
    bell(ac, N.Cs6, 0.06, 0.4, 0.08);
  },
  killSwitch: (ac) => {
    pluck(ac, { freq: 80, bend: 0.45, dur: 0.8, vol: 0.4, type: "sine", bright: 600 });
    noise(ac, { dur: 0.9, vol: 0.22, freq: 900, to: 70, type: "lowpass", send: 1 });
    pluck(ac, { freq: N.E4, bend: 0.25, dur: 0.4, vol: 0.12, type: "square", bright: 1400 });
  },
  honeypot: (ac) => [N.E5, N.Gs5, N.B5, N.E5 * 2].forEach((f, i) => bell(ac, f, i * 0.06, 0.6, 0.08)),
  win: (ac) => {
    [N.Cs4, N.F4, N.Gs4, N.Cs5, N.F5, N.Gs5].forEach((f, i) => pluck(ac, { freq: f, at: i * 0.045, dur: 0.5, vol: 0.13, bright: 4200, send: 1.3 }));
    pad(ac, [N.Cs4, N.F4, N.Gs4, N.Cs5], 0.04, 1.3, 0.07);
    pluck(ac, { freq: 87.3, at: 0.02, dur: 1.4, vol: 0.18, type: "sine", bright: 400, attack: 0.02 });
    [N.Gs5, N.Cs6, N.F5 * 2].forEach((f, i) => bell(ac, f, 0.32 + i * 0.12, 0.7, 0.05));
  },
  whoosh: (ac) => {
    swell(ac, 0, 0.85);
    pluck(ac, { freq: 90, at: 0.86, bend: 0.5, dur: 0.35, vol: 0.38, type: "sine", bright: 500 });
    noise(ac, { at: 0.86, dur: 0.25, vol: 0.14, freq: 360, to: 120, type: "lowpass" });
    [N.B5, N.D6, N.A5].forEach((f, i) => bell(ac, f, 0.95 + i * 0.09, 0.5, 0.04));
  },
  reveal: (ac) => [N.A5, N.B5, N.D6, N.Cs6, N.B5].forEach((f, i) => bell(ac, f, i * 0.07, 0.5, 0.05)),
  lost: (ac) => {
    [0, 0.07, 0.16].forEach((at) => noise(ac, { at, dur: 0.05, vol: 0.16, freq: 2400, q: 3, send: 0.2 }));
    pluck(ac, { freq: N.E5, at: 0.02, dur: 0.06, vol: 0.1, type: "square", bright: 3000, send: 0 });
    pluck(ac, { freq: N.B4, at: 0.1, dur: 0.06, vol: 0.1, type: "square", bright: 3000, send: 0 });
    powerDown(ac, 0.22, 1.5);
    [N.Gs4, N.E4, N.Cs4, N.A3].forEach((f, i) => pluck(ac, { freq: f, at: 0.3 + i * 0.2, dur: 0.5, vol: 0.13, bend: 0.97 }));
    pluck(ac, { freq: 55, at: 1.4, bend: 0.7, dur: 0.6, vol: 0.3, type: "sine", bright: 300 });
  },
  shutdown: (ac) => {
    [N.E5, N.Cs5, N.B4, N.A4].forEach((f, i) => bell(ac, f, i * 0.32, 1.4, 0.07));
    pad(ac, [N.A3, N.Cs4, N.E4], 0.1, 2.2, 0.035);
  },
  star: (ac, i) => {
    const f = [N.Cs5, N.F5, N.Gs5][Math.min(2, Math.max(0, i))];
    bell(ac, f, 0, 0.6, 0.12);
    pluck(ac, { freq: f / 2, dur: 0.2, vol: 0.12 });
  },
  buy: (ac) => {
    noise(ac, { dur: 0.05, vol: 0.12, freq: 5200, q: 4, send: 0.2 });
    pluck(ac, { freq: N.B5, dur: 0.12, vol: 0.12, type: "square", bright: 5000, send: 0.4 });
    pluck(ac, { freq: N.E5 * 2, at: 0.07, dur: 0.18, vol: 0.12, type: "square", bright: 5000, send: 0.4 });
    pluck(ac, { freq: N.Cs4, at: 0.14, dur: 0.3, vol: 0.16 });
    pluck(ac, { freq: N.Gs4, at: 0.14, dur: 0.3, vol: 0.12 });
    [N.Gs5, N.Cs6, N.F5 * 2].forEach((f, i) => bell(ac, f, 0.2 + i * 0.07, 0.5, 0.06));
  },
  equip: (ac) => {
    pluck(ac, { freq: N.Cs4, dur: 0.14, vol: 0.16 });
    pluck(ac, { freq: N.Gs4, at: 0.06, dur: 0.2, vol: 0.16 });
  },
  pick: (ac, rarity) => {
    const lift = Math.pow(2, Math.min(2, Math.max(0, rarity)) * (4 / 12));
    pluck(ac, { freq: N.E4 * lift, dur: 0.16, vol: 0.18 });
    bell(ac, N.B5 * lift, 0.04, 0.35, 0.06);
  },
  install: (ac) => {
    [N.Cs4, N.E4, N.Gs4, N.B4, N.Cs5].forEach((f, i) => pluck(ac, { freq: f, at: i * 0.055, dur: 0.18, vol: 0.14, bright: 3000 }));
    noise(ac, { dur: 0.3, vol: 0.06, freq: 600, to: 3000, q: 1.5, attack: 0.25 });
    pad(ac, [N.Cs5, N.F5, N.Gs5], 0.3, 0.6, 0.05);
    bell(ac, N.Cs6, 0.3, 0.6, 0.09);
  },
  reroll: (ac) => {
    [N.Gs4, N.E4, N.B4, N.Fs4, N.Cs5].forEach((f, i) => pluck(ac, { freq: f, at: i * 0.045, dur: 0.1, vol: 0.12, type: "sine", send: 0.5 }));
    noise(ac, { dur: 0.24, vol: 0.08, freq: 1200, to: 2800, q: 2, attack: 0.02 });
  },
  zone: (ac, id) => {
    const lift = Math.pow(2, (Math.min(Math.max(id, 1), 8) - 1) * (2 / 12));
    pluck(ac, { freq: N.A3 * lift, bend: 1.06, dur: 0.18, vol: 0.2, type: "sine" });
    pluck(ac, { freq: N.E4 * lift, at: 0.05, dur: 0.22, vol: 0.14 });
    bell(ac, N.A5 * lift, 0.09, 0.4, 0.05);
  },
  locked: (ac) => {
    pluck(ac, { freq: N.E3, bend: 0.8, dur: 0.14, vol: 0.2, type: "square", bright: 500 });
    pluck(ac, { freq: N.E3 * 0.94, at: 0.1, dur: 0.16, vol: 0.16, type: "square", bright: 450 });
  },
  unlock: (ac) => {
    pluck(ac, { freq: N.E4, dur: 0.1, vol: 0.14, type: "square", bright: 1800 });
    noise(ac, { at: 0.06, dur: 0.08, vol: 0.12, freq: 3000, q: 3 });
    [N.A4, N.Cs5, N.E5, N.A5].forEach((f, i) => pluck(ac, { freq: f, at: 0.16 + i * 0.06, dur: 0.3, vol: 0.13 }));
    bell(ac, N.Cs6, 0.42, 0.7, 0.07);
  },
  play: (ac) => {
    pluck(ac, { freq: 70, bend: 0.55, dur: 0.3, vol: 0.34, type: "sine", bright: 500 });
    [N.Cs4, N.E4, N.Gs4, N.B4, N.Cs5, N.E5].forEach((f, i) => pluck(ac, { freq: f, at: 0.03 + i * 0.035, dur: 0.22, vol: 0.13, bright: 4200 }));
    noise(ac, { dur: 0.28, vol: 0.08, freq: 500, to: 4200, q: 1.2, attack: 0.2 });
    bell(ac, N.Gs5, 0.24, 0.5, 0.08);
    bell(ac, N.Cs6, 0.3, 0.6, 0.08);
  },
  codex: (ac) => {
    noise(ac, { dur: 0.16, vol: 0.1, freq: 1200, to: 3800, q: 0.9, attack: 0.04, send: 0.3 });
    noise(ac, { at: 0.12, dur: 0.05, vol: 0.08, freq: 500, type: "lowpass", send: 0.2 });
    [N.E5, N.A5, N.B5].forEach((f, i) => bell(ac, f, 0.1 + i * 0.07, 0.6, 0.06));
    pad(ac, [N.A3, N.E4], 0.1, 0.7, 0.04);
  },
  page: (ac, side) => {
    noise(ac, { dur: 0.1, vol: 0.09, freq: side ? 3200 : 2200, to: side ? 1400 : 4200, q: 1, attack: 0.02, send: 0.2 });
    pluck(ac, { freq: side ? N.B4 : N.E4, at: 0.05, dur: 0.14, vol: 0.14 });
    bell(ac, side ? N.E5 * 2 : N.B5, 0.08, 0.3, 0.05);
  },
  zones: (ac) => {
    pluck(ac, { freq: N.A3, bend: 1.08, dur: 0.16, vol: 0.18, type: "sine" });
    [N.E4, N.A4, N.B4, N.E5].forEach((f, i) => pluck(ac, { freq: f, at: 0.05 + i * 0.06, dur: 0.2, vol: 0.12 }));
    noise(ac, { dur: 0.3, vol: 0.06, freq: 400, to: 1600, q: 1, attack: 0.15, send: 0.5 });
    bell(ac, N.A5, 0.3, 0.6, 0.06);
  },
  shop: (ac) => {
    bell(ac, N.E5 * 2, 0, 0.5, 0.08);
    bell(ac, N.B5, 0.09, 0.6, 0.07);
    noise(ac, { at: 0.02, dur: 0.12, vol: 0.05, freq: 6000, q: 3, send: 0.4 });
    pluck(ac, { freq: N.E4, at: 0.16, dur: 0.18, vol: 0.14 });
    pluck(ac, { freq: N.Gs4, at: 0.22, dur: 0.24, vol: 0.13 });
  },
  wave: (ac, final) => {
    const lift = final ? Math.pow(2, 3 / 12) : 1;
    pluck(ac, { freq: 65, bend: 0.6, dur: 0.3, vol: 0.32, type: "sine", bright: 500 });
    noise(ac, { dur: 0.12, vol: 0.1, freq: 1600, q: 0.9, send: 0.5 });
    pluck(ac, { freq: N.A3 * lift, at: 0.02, dur: 0.18, vol: 0.16, type: "sawtooth", bright: 1600 });
    pluck(ac, { freq: N.E4 * lift, at: 0.14, dur: 0.18, vol: 0.15, type: "sawtooth", bright: 1800 });
    pluck(ac, { freq: N.A4 * lift, at: 0.26, dur: 0.42, vol: 0.16, type: "sawtooth", bright: 2400 });
    pad(ac, [N.A3 * lift, N.Cs4 * lift, N.E4 * lift], 0.26, 0.6, 0.05);
    bell(ac, N.A5 * lift, 0.3, 0.5, 0.05);
  },
  settings: (ac) => {
    pluck(ac, { freq: N.E4, dur: 0.06, vol: 0.12, type: "square", bright: 2200, send: 0.2 });
    pluck(ac, { freq: N.B4, at: 0.05, dur: 0.06, vol: 0.1, type: "square", bright: 2200, send: 0.2 });
    noise(ac, { at: 0.02, dur: 0.18, vol: 0.06, freq: 900, to: 2400, q: 2, attack: 0.08, send: 0.3 });
    pluck(ac, { freq: N.A4, at: 0.12, dur: 0.22, vol: 0.13 });
    bell(ac, N.E5, 0.16, 0.45, 0.06);
  },
  hurt: (ac) => {
    yelp(ac, 0.05, 560, 900, 360, 0.3, 0.5);
    pluck(ac, { freq: N.B3, at: 0.05, bend: 0.7, dur: 0.18, vol: 0.08, type: "square", bright: 900, send: 0.2 });
  },
  glitch: (ac, cue) => {
    const back = cue % 2 === 1;
    const k = cue >= 2 ? 0.45 : 1;
    const blips = back ? [1900, 700, 2600] : [1200, 2900, 500, 2200, 1500];
    blips.forEach((f, i) => pluck(ac, { freq: f, at: i * 0.022, dur: 0.03, vol: 0.09 * k, type: "square", bright: 6000, send: 0.1 }));
    [0, 0.045, 0.08].forEach((at) => noise(ac, { at, dur: 0.025, vol: 0.12 * k, freq: 3400, q: 2.5, send: 0.1 }));
    pluck(ac, { freq: back ? 220 : 1800, bend: back ? 7 : 0.12, at: back ? 0 : 0.09, dur: 0.16, vol: 0.14 * k, type: "sine", bright: 5000, send: 0.4 });
    if (back) bell(ac, N.E5 * 2, 0.12, 0.25, 0.04 * k);
  },
  briefing: (ac) => [N.E4, N.A4, N.Cs5].forEach((f, i) => pluck(ac, { freq: f, at: i * 0.08, dur: 0.24, vol: 0.14 })),
};

export function playSfx(name: SfxName, level = 1, delayMs = 0) {
  loadSetting();
  if (!enabled) return;
  if (delayMs > 0) {
    window.setTimeout(() => playSfx(name, level), delayMs);
    return;
  }
  const now = performance.now();
  const gap = MIN_GAP_MS[name];
  if (gap && now - (lastPlayed.get(name) ?? -1e9) < gap) return;
  lastPlayed.set(name, now);
  const ac = audio();
  if (!ac || !dry) return;
  try {
    Sounds[name](ac, level);
  } catch {}
}

export function unlockAudio() {
  loadSetting();
  if (enabled) audio();
}

export function soundEnabled() {
  loadSetting();
  return enabled;
}

export function setSoundEnabled(on: boolean) {
  enabled = on;
  try {
    window.localStorage.setItem(KEY, on ? "on" : "off");
  } catch {}
  listeners.forEach((l) => l());
  if (on) playSfx("tap");
}

export function soundVolume() {
  loadSetting();
  return volume;
}

export function setSoundVolume(next: number) {
  loadSetting();
  volume = Math.min(1, Math.max(0, next));
  try {
    window.localStorage.setItem(VOLUME_KEY, String(volume));
  } catch {}
  if (master && ctx) master.gain.setTargetAtTime(volume * volume * MASTER_GAIN, ctx.currentTime, 0.02);
  listeners.forEach((l) => l());
}

export function useSoundVolume(): number {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    soundVolume,
    () => DEFAULT_VOLUME,
  );
}

export function useSoundEnabled(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    soundEnabled,
    () => true,
  );
}
