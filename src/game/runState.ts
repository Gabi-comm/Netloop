import { endlessWave, getStage, stageThreats, WAVES_PER_STAGE, type Stage, type WaveDef } from "@/data/stages";
import type { ItemId } from "./items";
import type { PacketKindId } from "./kinds";
import { patchValue, type PatchId } from "./patches";
import { createRng, type Rng } from "./random";

export type RunState = {
  stage: Stage;
  wave: number;
  maxWaves: number;
  score: number;
  uptime: number;
  maxUptime: number;
  patches: PatchId[];
  levels: Partial<Record<PatchId, number>>;
  killSwitchSpent: number;
  items: ItemId[];
  itemsUsed: ItemId[];
  shields: number;
  dataBoost: boolean;
  reviveArmed: boolean;
  dataEarned: number;
  dropped: number;
  breaches: PacketKindId[];
  paidRerolls: number;
  briefed: PacketKindId[];
  rng: Rng;
  waves: WaveDef[];
};

export function randomSeed(): number {
  return (Math.random() * 2 ** 32) >>> 0;
}

export function rollWaves(stage: Stage, rng: Rng): WaveDef[] {
  if (stage.endless) return [];
  const pool = stageThreats(stage);
  return stage.waves.map((base, i) => {
    const featured = base.featured ?? [];
    const size = Math.min(pool.length, 2 + i + rng.int(2));
    const picks = new Set<PacketKindId>(featured);
    for (const id of rng.shuffle(pool)) {
      if (picks.size >= Math.max(size, featured.length)) break;
      picks.add(id);
    }
    const mix: WaveDef["mix"] = {};
    for (const id of picks) mix[id] = 1 + rng.int(3);
    return { ...base, mix };
  });
}

export function currentWave(run: RunState): WaveDef {
  return run.stage.endless ? endlessWave(run.wave) : run.waves[run.wave - 1];
}

export function createRun(stageId: number, levels: Partial<Record<PatchId, number>> = {}, seed = randomSeed(), items: ItemId[] = []): RunState {
  const stage = getStage(stageId);
  if (!stage) throw new Error(`unknown stage ${stageId}`);
  const rng = createRng(seed);
  return {
    stage,
    wave: 1,
    maxWaves: stage.endless ? Infinity : WAVES_PER_STAGE,
    score: 0,
    uptime: 3,
    maxUptime: 3,
    patches: [],
    levels: { ...levels },
    killSwitchSpent: 0,
    items: [...items],
    itemsUsed: [],
    shields: 0,
    dataBoost: false,
    reviveArmed: false,
    dataEarned: 0,
    dropped: 0,
    breaches: [],
    paidRerolls: 0,
    briefed: [],
    rng,
    waves: rollWaves(stage, rng),
  };
}

export function hasPatch(run: RunState, id: PatchId): boolean {
  return run.patches.includes(id);
}

export function patchLevel(run: RunState, id: PatchId): number {
  return run.levels[id] ?? 1;
}

export function patchPower(run: RunState, id: PatchId): number {
  return hasPatch(run, id) ? patchValue(id, patchLevel(run, id)) : 0;
}

export function patchCount(run: RunState, id: PatchId): number {
  return run.patches.filter((p) => p === id).length;
}

export function killSwitchCharges(run: RunState): number {
  return Math.max(0, patchCount(run, "killSwitch") - run.killSwitchSpent);
}

export const REROLL_BASE_COST = 10;

export function rerollCost(run: RunState): number {
  return REROLL_BASE_COST * 2 ** run.paidRerolls;
}

export function starsFor(run: RunState): number {
  return Math.max(1, Math.min(3, run.uptime));
}

export function dataMultiplier(run: RunState): number {
  return 1 + patchPower(run, "dataMiner") / 100 + (run.dataBoost ? 0.5 : 0);
}

export function packetData(run: RunState): number {
  return Math.round(run.dataEarned * dataMultiplier(run));
}

export function applyInstallEffects(run: RunState, id: PatchId) {
  if (id === "backupServer") {
    run.maxUptime += 1;
    run.uptime += 1;
  }
}
