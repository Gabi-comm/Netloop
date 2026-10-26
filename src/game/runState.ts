import { getStage, WAVES_PER_STAGE, type Stage } from "@/data/stages";
import type { PacketKindId } from "./kinds";
import type { PatchId } from "./patches";
import { createRng, type Rng } from "./random";

export type RunState = {
  stage: Stage;
  wave: number;
  maxWaves: number;
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
  rng: Rng;
};

export function createRun(stageId: number, seedOffset = 0): RunState {
  const stage = getStage(stageId);
  if (!stage) throw new Error(`unknown stage ${stageId}`);
  return {
    stage,
    wave: 1,
    maxWaves: stage.endless ? Infinity : WAVES_PER_STAGE,
    score: 0,
    uptime: 3,
    maxUptime: 3,
    patches: [],
    killSwitchSpent: 0,
    dataEarned: 0,
    dropped: 0,
    breaches: [],
    paidRerolls: 0,
    briefed: [],
    rng: createRng(stage.seed + seedOffset),
  };
}

export function hasPatch(run: RunState, id: PatchId): boolean {
  return run.patches.includes(id);
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
