import { useSyncExternalStore } from "react";
import { audioGraph, lowPowerAudio, roomImpulse } from "./sfx";

const KEY = "netloop.music.v1";
const VOLUME_KEY = "netloop.musicVolume.v1";
const DEFAULT_VOLUME = 0.5;
const MUSIC_GAIN = 0.9;
const BPM = 132;
const EIGHTH = 60 / BPM / 2;
const LOOKAHEAD_S = 0.35;
const TICK_MS = 60;
const LOOP_BARS = 32;

const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const SCALE = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84];
const CHORDS = [
  { bass: 48, tones: [60, 64, 67, 72] },
  { bass: 43, tones: [59, 62, 67, 71] },
  { bass: 45, tones: [57, 60, 64, 69] },
  { bass: 41, tones: [57, 60, 65, 69] },
];

let enabled = true;
let volume = DEFAULT_VOLUME;
let loaded = false;
let playing = false;
let ducked = false;
let timer: number | null = null;
let nextTime = 0;
let step = 0;
let melodyIndex = 5;
let out: GainNode | null = null;
let duck: GainNode | null = null;
let input: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
const listeners = new Set<() => void>();

function loadSetting() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    enabled = window.localStorage.getItem(KEY) !== "off";
    const raw = window.localStorage.getItem(VOLUME_KEY);
    const stored = Number(raw);
    volume = raw !== null && Number.isFinite(stored) ? Math.min(1, Math.max(0, stored)) : DEFAULT_VOLUME;
  } catch {
    enabled = true;
  }
}

function chain(ac: AudioContext, bus: AudioNode) {
  if (input) return input;
  out = ac.createGain();
  out.gain.value = volume * volume * MUSIC_GAIN;
  duck = ac.createGain();
  duck.gain.value = ducked ? 0.0001 : 1;
  input = ac.createGain();
  const cave = ac.createConvolver();
  cave.buffer = roomImpulse(ac, 3.4);
  const send = ac.createGain();
  send.gain.value = 0.35;
  input.connect(duck);
  input.connect(send).connect(cave).connect(duck);
  duck.connect(out).connect(bus);
  return input;
}

function crystal(ac: AudioContext, dest: AudioNode, freq: number, t: number, vol: number, decay = 3.2) {
  const partials: [number, number, number][] = [
    [1, 1, 0],
    [1, 0.5, 5],
    [2.76, 0.16, 0],
    [5.4, 0.05, 0],
  ];
  for (const [ratio, amp, detune] of lowPowerAudio() ? partials.slice(0, 3) : partials) {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sine";
    osc.frequency.value = freq * ratio;
    osc.detune.value = detune;
    const d = ratio > 2 ? decay * 0.35 : decay;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol * amp, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + d);
    osc.connect(gain).connect(dest);
    osc.start(t);
    osc.stop(t + d + 0.05);
  }
}

function bass(ac: AudioContext, dest: AudioNode, freq: number, t: number, vol: number) {
  const filter = ac.createBiquadFilter();
  const gain = ac.createGain();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1400, t);
  filter.frequency.exponentialRampToValueAtTime(300, t + 0.16);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  filter.connect(gain).connect(dest);
  for (const [type, mult] of [["triangle", 1], ["square", 1]] as const) {
    const osc = ac.createOscillator();
    osc.type = type;
    osc.frequency.value = freq * mult;
    osc.detune.value = type === "square" ? 6 : 0;
    osc.connect(filter);
    osc.start(t);
    osc.stop(t + 0.26);
  }
}

function noise(ac: AudioContext) {
  if (!noiseBuffer) {
    noiseBuffer = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

function shaker(ac: AudioContext, dest: AudioNode, t: number, vol: number) {
  const src = ac.createBufferSource();
  const filter = ac.createBiquadFilter();
  const gain = ac.createGain();
  src.buffer = noise(ac);
  filter.type = "highpass";
  filter.frequency.value = 6500;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  src.connect(filter).connect(gain).connect(dest);
  src.start(t, Math.random() * 0.8);
  src.stop(t + 0.12);
}

function thump(ac: AudioContext, dest: AudioNode, t: number, vol = 0.16) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(130, t);
  osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
  osc.connect(gain).connect(dest);
  osc.start(t);
  osc.stop(t + 0.3);
}

function clap(ac: AudioContext, dest: AudioNode, t: number, vol: number) {
  const src = ac.createBufferSource();
  const filter = ac.createBiquadFilter();
  const gain = ac.createGain();
  src.buffer = noise(ac);
  filter.type = "bandpass";
  filter.frequency.value = 1600;
  filter.Q.value = 0.9;
  gain.gain.setValueAtTime(0.0001, t);
  for (const off of [0, 0.012, 0.024]) {
    gain.gain.setValueAtTime(vol, t + off);
    gain.gain.exponentialRampToValueAtTime(vol * 0.3, t + off + 0.01);
  }
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  src.connect(filter).connect(gain).connect(dest);
  src.start(t, Math.random() * 0.7);
  src.stop(t + 0.2);
}

function nextMelodyNote() {
  const r = Math.random();
  const move = r < 0.35 ? 1 : r < 0.7 ? -1 : r < 0.82 ? 2 : r < 0.94 ? -2 : 0;
  melodyIndex = Math.min(SCALE.length - 1, Math.max(2, melodyIndex + move));
  return SCALE[melodyIndex];
}

function scheduleStep(ac: AudioContext, dest: AudioNode, t: number) {
  const bar = Math.floor(step / 8) % LOOP_BARS;
  const beat = step % 8;
  const chord = CHORDS[bar % CHORDS.length];
  const intro = bar < 4;
  const breakdown = bar >= 16 && bar < 20;
  const fill = bar % 8 === 7 && beat >= 6;

  const root = midi(chord.bass);
  if (!breakdown || beat % 4 === 0) bass(ac, dest, beat % 2 ? root * 2 : root, t, beat % 2 ? 0.055 : 0.075);

  const chance = fill ? 0.95 : beat % 2 === 0 ? 0.72 : 0.5;
  if (Math.random() < chance) {
    const note = nextMelodyNote();
    if (Math.random() < 0.18) crystal(ac, dest, midi(note + 12), t + EIGHTH / 2, 0.022, 0.5);
    crystal(ac, dest, midi(note), t, beat === 0 ? 0.06 : 0.048, 1.1);
  }

  if (!intro && beat % 2 === 1) {
    const tone = chord.tones[(beat + bar) % chord.tones.length];
    crystal(ac, dest, midi(tone), t, breakdown ? 0.034 : 0.022, 0.6);
  }

  if (!breakdown) {
    if (!intro && beat % 2 === 0) thump(ac, dest, t);
    if (intro && beat === 0) thump(ac, dest, t, 0.1);
    if (beat % 2 === 1) shaker(ac, dest, t, 0.026);
    else shaker(ac, dest, t, 0.01);
    if (!intro && (beat === 2 || beat === 6)) clap(ac, dest, t, 0.09);
    if (fill && beat === 7) clap(ac, dest, t, 0.06);
  } else if (bar === 19 && beat >= 4) {
    thump(ac, dest, t, 0.08 + (beat - 4) * 0.025);
  }
}

function tick() {
  const graph = audioGraph();
  if (!graph) return;
  const { ctx, bus } = graph;
  const dest = chain(ctx, bus);
  if (nextTime < ctx.currentTime) nextTime = ctx.currentTime + 0.1;
  while (nextTime < ctx.currentTime + LOOKAHEAD_S) {
    scheduleStep(ctx, dest, nextTime);
    nextTime += EIGHTH;
    step++;
  }
}

function start() {
  loadSetting();
  if (!enabled || playing || typeof window === "undefined") return;
  if (document.hidden) return;
  playing = true;
  nextTime = 0;
  tick();
  timer = window.setInterval(tick, TICK_MS);
}

function stop() {
  playing = false;
  if (timer !== null) window.clearInterval(timer);
  timer = null;
}

export const music = {
  start,
  stop,
  resumeIfHidden: () => {
    if (document.hidden) stop();
    else start();
  },
  duck(on: boolean) {
    ducked = on;
    const graph = audioGraph();
    if (duck && graph) duck.gain.setTargetAtTime(on ? 0.0001 : 1, graph.ctx.currentTime, on ? 0.25 : 0.8);
  },
};

function notify() {
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function musicEnabled() {
  loadSetting();
  return enabled;
}

export function setMusicEnabled(on: boolean) {
  loadSetting();
  enabled = on;
  try {
    window.localStorage.setItem(KEY, on ? "on" : "off");
  } catch {}
  if (on) start();
  else stop();
  notify();
}

export function musicVolume() {
  loadSetting();
  return volume;
}

export function setMusicVolume(next: number) {
  loadSetting();
  volume = Math.min(1, Math.max(0, next));
  try {
    window.localStorage.setItem(VOLUME_KEY, String(volume));
  } catch {}
  const graph = audioGraph();
  if (out && graph) out.gain.setTargetAtTime(volume * volume * MUSIC_GAIN, graph.ctx.currentTime, 0.05);
  notify();
}

export function useMusicEnabled(): boolean {
  return useSyncExternalStore(subscribe, musicEnabled, () => true);
}

export function useMusicVolume(): number {
  return useSyncExternalStore(subscribe, musicVolume, () => DEFAULT_VOLUME);
}
