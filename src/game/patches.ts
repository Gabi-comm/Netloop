import { NetColors } from "./colors";
import type { Rng } from "./random";
import { Sprites, type SpriteAnim } from "./sprites";

export type Rarity = "common" | "rare" | "epic";

export const RarityStyle: Record<Rarity, { label: string; color: string; order: number }> = {
  common: { label: "COMMON", color: NetColors.soft, order: 0 },
  rare: { label: "RARE", color: NetColors.rare, order: 1 },
  epic: { label: "EPIC", color: NetColors.epicLight, order: 2 },
};

export type PatchId =
  | "rateLimiter"
  | "broadcast"
  | "autoPatch"
  | "vpnTunnel"
  | "honeypot"
  | "killSwitch"
  | "overclock"
  | "wideSnap"
  | "dataMiner"
  | "backupServer";

export type Patch = {
  id: PatchId;
  title: string;
  rarity: Rarity;
  isActive: boolean;
  stackable?: boolean;
  description: string;
  icon: SpriteAnim;
  price?: number;
};

export const MAX_PATCH_LEVEL = 5;

const UPGRADE_BASE: Record<Rarity, number> = { common: 60, rare: 100, epic: 160 };

export const PatchLevels: Record<PatchId, number[]> = {
  rateLimiter: [40, 45, 50, 55, 60],
  broadcast: [25, 35, 45, 55, 65],
  autoPatch: [0, 15, 30, 45, 60],
  vpnTunnel: [1, 2, 3, 4, 5],
  honeypot: [3, 3.5, 4, 4.5, 5],
  killSwitch: [0, 1, 1.5, 2, 2.5],
  overclock: [50, 65, 80, 95, 110],
  wideSnap: [40, 50, 60, 70, 80],
  dataMiner: [25, 35, 45, 55, 65],
  backupServer: [0, 10, 20, 30, 40],
};

export function clampLevel(level: number | undefined): number {
  return Math.min(MAX_PATCH_LEVEL, Math.max(1, Math.floor(level ?? 1)));
}

export function patchValue(id: PatchId, level: number | undefined): number {
  return PatchLevels[id][clampLevel(level) - 1];
}

export function honeypotCooldownS(level: number | undefined): number {
  return 20 - (clampLevel(level) - 1) * 2;
}

export function upgradeCost(patch: Patch, level: number): number {
  return UPGRADE_BASE[patch.rarity] * level;
}

const Describe: Record<PatchId, (v: number, level: number) => string> = {
  rateLimiter: (v) => `packets move ${v}% slower while you draw`,
  broadcast: (v) => `+${v}% bandwidth for longer lines`,
  autoPatch: (v) => (v ? `regain 1 uptime after every wave · ${v}% chance to regain 2` : "regain 1 uptime after every wave"),
  vpnTunnel: (v) => (v === 1 ? "first zero-day hit each wave won't break your line" : `first ${v} zero-day hits each wave won't break your line`),
  honeypot: (v, level) => `tap to freeze every threat for ${v} seconds · recharges in ${honeypotCooldownS(level)}s`,
  killSwitch: (v) => (v ? `tap to drop every threat on screen, then freeze new ones for ${v}s. each copy is one use` : "tap to drop every threat on screen. each copy is one use"),
  overclock: (v) => `bandwidth recharges ${v}% faster`,
  wideSnap: (v) => `loops close from ${v}% farther away`,
  dataMiner: (v) => `+${v}% data from packets this run`,
  backupServer: (v) => (v ? `+1 max uptime and 1 free uptime · ${v}% chance to block a breach` : "+1 max uptime, and it comes with 1 free uptime"),
};

const Stat: Record<PatchId, (v: number, level: number) => string> = {
  rateLimiter: (v) => `${v}% slower`,
  broadcast: (v) => `+${v}% bandwidth`,
  autoPatch: (v) => `${v}% chance of +2`,
  vpnTunnel: (v) => `${v} block${v > 1 ? "s" : ""} a wave`,
  honeypot: (v, level) => `${v}s freeze, ${honeypotCooldownS(level)}s recharge`,
  killSwitch: (v) => `${v}s freeze after`,
  overclock: (v) => `+${v}% recharge`,
  wideSnap: (v) => `+${v}% snap range`,
  dataMiner: (v) => `+${v}% data`,
  backupServer: (v) => `${v}% block chance`,
};

export function patchStat(id: PatchId, level: number | undefined): string {
  const l = clampLevel(level);
  return Stat[id](patchValue(id, l), l);
}

export function describePatch(id: PatchId, level: number | undefined): string {
  const l = clampLevel(level);
  return Describe[id](patchValue(id, l), l);
}

type PatchBase = Omit<Patch, "description">;

const Base: Record<PatchId, PatchBase> = {
  rateLimiter: { id: "rateLimiter", title: "Rate Limiter", rarity: "common", isActive: false, icon: Sprites.patch_rate_limiter },
  broadcast: { id: "broadcast", title: "Broadcast", rarity: "common", isActive: false, icon: Sprites.patch_broadcast },
  autoPatch: { id: "autoPatch", title: "Auto-Patch", rarity: "rare", isActive: false, icon: Sprites.patch_auto_patch },
  vpnTunnel: { id: "vpnTunnel", title: "VPN Tunnel", rarity: "rare", isActive: false, icon: Sprites.patch_vpn_tunnel },
  honeypot: { id: "honeypot", title: "Honeypot", rarity: "rare", isActive: true, icon: Sprites.patch_honeypot },
  killSwitch: { id: "killSwitch", title: "Kill Switch", rarity: "epic", isActive: true, stackable: true, icon: Sprites.patch_kill_switch },
  overclock: { id: "overclock", title: "Overclock", rarity: "common", isActive: false, icon: Sprites.patch_overclock, price: 120 },
  wideSnap: { id: "wideSnap", title: "Wide Snap", rarity: "common", isActive: false, icon: Sprites.patch_wide_snap, price: 120 },
  dataMiner: { id: "dataMiner", title: "Data Miner", rarity: "rare", isActive: false, icon: Sprites.patch_data_miner, price: 240 },
  backupServer: { id: "backupServer", title: "Backup Server", rarity: "epic", isActive: false, icon: Sprites.patch_backup_server, price: 400 },
};

export const Patches = Object.fromEntries(
  Object.values(Base).map((p) => [p.id, { ...p, description: describePatch(p.id, 1) }]),
) as Record<PatchId, Patch>;

export const ShopPatches: Patch[] = Object.values(Patches).sort((a, b) => RarityStyle[a.rarity].order - RarityStyle[b.rarity].order);

export function patchItemKey(id: PatchId): string {
  return `patch:${id}`;
}

export function patchUnlocked(patch: Patch, inventory: readonly string[]): boolean {
  return patch.price === undefined || inventory.includes(patchItemKey(patch.id));
}

export function patchSeenKey(id: PatchId): string {
  return `patch:${id}`;
}

export function patchTag(patch: Patch, level?: number): string {
  const label = RarityStyle[patch.rarity].label;
  const tag = patch.isActive ? `${label} · ACTIVE` : label;
  return level === undefined ? tag : `${tag} · LV ${clampLevel(level)}`;
}

export function offerPatches(owned: readonly PatchId[], rng: Rng, count = 3, inventory: readonly string[] = []): Patch[] {
  return rng
    .shuffle(Object.values(Patches).filter((p) => patchUnlocked(p, inventory) && (p.stackable || !owned.includes(p.id))))
    .slice(0, count)
    .sort((a, b) => RarityStyle[a.rarity].order - RarityStyle[b.rarity].order);
}
