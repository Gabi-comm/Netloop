import { ENDLESS_ID } from "@/data/stages";
import type { PacketKindId } from "@/game/kinds";
import type { PatchId } from "@/game/patches";
import { createRun, randomSeed, type RunState } from "@/game/runState";
import { createRng } from "@/game/random";

const KEY = "netloop.endlessRun.v1";

export type EndlessView = "fight" | "powerup";

type EndlessSave = {
  view: EndlessView;
  wave: number;
  score: number;
  uptime: number;
  maxUptime: number;
  patches: PatchId[];
  killSwitchSpent: number;
  dataEarned: number;
  dropped: number;
  breaches: PacketKindId[];
  paidRerolls: number;
  briefed: PacketKindId[];
};

export function saveEndless(run: RunState, view: EndlessView) {
  const save: EndlessSave = {
    view,
    wave: run.wave,
    score: run.score,
    uptime: run.uptime,
    maxUptime: run.maxUptime,
    patches: [...run.patches],
    killSwitchSpent: run.killSwitchSpent,
    dataEarned: run.dataEarned,
    dropped: run.dropped,
    breaches: [...run.breaches],
    paidRerolls: run.paidRerolls,
    briefed: [...run.briefed],
  };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(save));
  } catch {}
}

function readSave(): EndlessSave | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const save = JSON.parse(raw) as EndlessSave;
    if (!Number.isInteger(save.wave) || save.wave < 1 || !Array.isArray(save.patches) || save.uptime < 1) return null;
    return save;
  } catch {
    return null;
  }
}

export function savedEndlessWave(): number | null {
  return readSave()?.wave ?? null;
}

export function loadEndless(): { run: RunState; view: EndlessView } | null {
  const save = readSave();
  if (!save) return null;
  const run = createRun(ENDLESS_ID);
  run.wave = save.wave;
  run.score = save.score;
  run.uptime = save.uptime;
  run.maxUptime = save.maxUptime;
  run.patches = [...save.patches];
  run.killSwitchSpent = save.killSwitchSpent;
  run.dataEarned = save.dataEarned;
  run.dropped = save.dropped;
  run.breaches = [...save.breaches];
  run.paidRerolls = save.paidRerolls;
  run.briefed = [...save.briefed];
  run.rng = createRng(randomSeed());
  return { run, view: save.view === "powerup" ? "powerup" : "fight" };
}

export function clearEndless() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {}
}
