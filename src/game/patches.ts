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

export const Patches: Record<PatchId, Patch> = {
  rateLimiter: { id: "rateLimiter", title: "Rate Limiter", rarity: "common", isActive: false, description: "packets move 40% slower while you draw", icon: Sprites.patch_rate_limiter },
  broadcast: { id: "broadcast", title: "Broadcast", rarity: "common", isActive: false, description: "+25% bandwidth for longer lines", icon: Sprites.patch_broadcast },
  autoPatch: { id: "autoPatch", title: "Auto-Patch", rarity: "rare", isActive: false, description: "regain 1 uptime after every wave", icon: Sprites.patch_auto_patch },
  vpnTunnel: { id: "vpnTunnel", title: "VPN Tunnel", rarity: "rare", isActive: false, description: "first zero-day hit each wave won't break your line", icon: Sprites.patch_vpn_tunnel },
  honeypot: { id: "honeypot", title: "Honeypot", rarity: "rare", isActive: true, description: "tap to freeze every threat for 3 seconds", icon: Sprites.patch_honeypot },
  killSwitch: { id: "killSwitch", title: "Kill Switch", rarity: "epic", isActive: true, stackable: true, description: "tap to drop every threat on screen. each copy is one use", icon: Sprites.patch_kill_switch },
  overclock: { id: "overclock", title: "Overclock", rarity: "common", isActive: false, description: "bandwidth recharges 50% faster", icon: Sprites.patch_overclock, price: 120 },
  wideSnap: { id: "wideSnap", title: "Wide Snap", rarity: "common", isActive: false, description: "loops close from 40% farther away", icon: Sprites.patch_wide_snap, price: 120 },
  dataMiner: { id: "dataMiner", title: "Data Miner", rarity: "rare", isActive: false, description: "+25% data from packets this run", icon: Sprites.patch_data_miner, price: 240 },
  backupServer: { id: "backupServer", title: "Backup Server", rarity: "epic", isActive: false, description: "+1 max uptime, and it comes with 1 free uptime", icon: Sprites.patch_backup_server, price: 400 },
};

export const ShopPatches: Patch[] = Object.values(Patches)
  .filter((p) => p.price !== undefined)
  .sort((a, b) => RarityStyle[a.rarity].order - RarityStyle[b.rarity].order);

export function patchItemKey(id: PatchId): string {
  return `patch:${id}`;
}

export function patchUnlocked(patch: Patch, inventory: readonly string[]): boolean {
  return patch.price === undefined || inventory.includes(patchItemKey(patch.id));
}

export function patchSeenKey(id: PatchId): string {
  return `patch:${id}`;
}

export function patchTag(patch: Patch): string {
  const label = RarityStyle[patch.rarity].label;
  return patch.isActive ? `${label} · ACTIVE` : label;
}

export function offerPatches(owned: readonly PatchId[], rng: Rng, count = 3, inventory: readonly string[] = []): Patch[] {
  return rng
    .shuffle(Object.values(Patches).filter((p) => patchUnlocked(p, inventory) && (p.stackable || !owned.includes(p.id))))
    .slice(0, count)
    .sort((a, b) => RarityStyle[a.rarity].order - RarityStyle[b.rarity].order);
}
