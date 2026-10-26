import type { WaveDef } from "@/data/stages";
import { PacketKinds, type PacketKindId } from "./kinds";
import type { Rng } from "./random";

export type Spawn = { kind: PacketKindId; atMs: number; cable: number; progress?: number };

function weightedPick(mix: WaveDef["mix"], rng: Rng): PacketKindId {
  const entries = Object.entries(mix) as [PacketKindId, number][];
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = rng.next() * total;
  for (const [id, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return id;
  }
  return entries[entries.length - 1][0];
}

export function buildWave(def: WaveDef, cableCount: number, rng: Rng): Spawn[] {
  const featured = [...(def.featured ?? [])];
  const featuredSlots = new Map<number, PacketKindId>();
  featured.forEach((kind, i) => featuredSlots.set(1 + i * 2, kind));

  const spawns: Spawn[] = [];
  let at = 1200;
  for (let i = 0; i < def.count; i++) {
    const cable = rng.int(cableCount);
    const kind: PacketKindId = featuredSlots.get(i) ?? (rng.next() < def.legitShare ? "legit" : weightedPick(def.mix, rng));
    if (kind === "pingFlood") {
      for (let k = 0; k < 3; k++) spawns.push({ kind, atMs: at + k * 160, cable });
    } else if (kind === "mitm") {
      spawns.push({ kind: "legit", atMs: at, cable, progress: 0.11 });
      spawns.push({ kind, atMs: at, cable });
    } else {
      spawns.push({ kind, atMs: at, cable });
    }
    at += def.intervalMs + rng.range(-180, 180);
  }
  return spawns.sort((a, b) => a.atMs - b.atMs);
}

export function threatCount(spawns: readonly Spawn[]): number {
  return spawns.filter((s) => PacketKinds[s.kind].isThreat).length;
}
