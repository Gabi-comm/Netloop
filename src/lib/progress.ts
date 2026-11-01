"use client";

import { useSyncExternalStore } from "react";
import { ENDLESS_ID, Stages } from "@/data/stages";

export type StageRecord = { stars: number; best: number; clears: number };

export type Progress = {
  version: 1;
  data: number;
  stages: Record<number, StageRecord>;
  lastCleared: number | null;
  inventory: string[];
  seen: string[];
  equippedSkin: string;
  endless: EndlessRecord;
};

export type EndlessRecord = { bestWaves: number; bestScore: number; runs: number };

const KEY = "netloop.progress.v1";

const EMPTY: Progress = { version: 1, data: 0, stages: {}, lastCleared: null, inventory: [], seen: [], equippedSkin: "classic", endless: { bestWaves: 0, bestScore: 0, runs: 0 } };

let current: Progress = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) current = { ...EMPTY, ...(JSON.parse(raw) as Partial<Progress>), version: 1 };
  } catch {
    current = EMPTY;
  }
}

function save(next: Progress) {
  current = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    loaded = false;
    load();
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): Progress {
  load();
  return current;
}

function getServerSnapshot(): Progress {
  return EMPTY;
}

export function useProgress(): Progress {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export const progressStore = {
  get: getSnapshot,

  recordStageClear(stageId: number, score: number, stars: number, dataEarned: number) {
    const prev = getSnapshot();
    const old = prev.stages[stageId];
    save({
      ...prev,
      data: prev.data + dataEarned,
      lastCleared: stageId,
      stages: {
        ...prev.stages,
        [stageId]: {
          stars: Math.max(old?.stars ?? 0, stars),
          best: Math.max(old?.best ?? 0, score),
          clears: (old?.clears ?? 0) + 1,
        },
      },
    });
  },

  consumeLastCleared(): number | null {
    const prev = getSnapshot();
    if (prev.lastCleared === null) return null;
    save({ ...prev, lastCleared: null });
    return prev.lastCleared;
  },

  addData(amount: number) {
    const prev = getSnapshot();
    save({ ...prev, data: Math.max(0, prev.data + amount) });
  },

  spendData(amount: number): boolean {
    const prev = getSnapshot();
    if (prev.data < amount) return false;
    save({ ...prev, data: prev.data - amount });
    return true;
  },

  addItem(itemId: string) {
    const prev = getSnapshot();
    if (prev.inventory.includes(itemId)) return;
    save({ ...prev, inventory: [...prev.inventory, itemId] });
  },

  buyItem(itemId: string, price: number): boolean {
    const prev = getSnapshot();
    if (prev.inventory.includes(itemId) || prev.data < price) return false;
    save({ ...prev, data: prev.data - price, inventory: [...prev.inventory, itemId] });
    return true;
  },

  equipSkin(skinId: string) {
    const prev = getSnapshot();
    if (prev.equippedSkin === skinId) return;
    save({ ...prev, equippedSkin: skinId });
  },

  markSeen(kindId: string) {
    const prev = getSnapshot();
    if (prev.seen.includes(kindId)) return;
    save({ ...prev, seen: [...prev.seen, kindId] });
  },

  recordEndless(wavesSurvived: number, score: number, dataEarned: number): EndlessRecord {
    const prev = getSnapshot();
    const old = prev.endless;
    const next = {
      bestWaves: Math.max(old.bestWaves, wavesSurvived),
      bestScore: Math.max(old.bestScore, score),
      runs: old.runs + 1,
    };
    save({ ...prev, data: prev.data + dataEarned, endless: next });
    return old;
  },

  reset() {
    save(EMPTY);
  },
};

export function isStageUnlocked(progress: Progress, stageId: number): boolean {
  if (stageId === ENDLESS_ID) return true;
  return stageId === 1 || Boolean(progress.stages[stageId - 1]);
}

export function nextStageId(progress: Progress): number {
  const open = Stages.find((s) => !progress.stages[s.id] && isStageUnlocked(progress, s.id));
  return open?.id ?? Stages[Stages.length - 1].id;
}

export function clearedCount(progress: Progress): number {
  return Stages.filter((s) => progress.stages[s.id]).length;
}
