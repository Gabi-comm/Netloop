export type SpriteName =
  | "bit_idle" | "bit_draw" | "bit_hurt"
  | "server_idle" | "server_alert" | "server_hurt"
  | "legit_walk" | "legit_scared"
  | "malware_walk" | "malware_pop"
  | "ping_flood_swarm"
  | "worm_crawl" | "worm_mini_crawl"
  | "ransomware_walk" | "ransomware_cracked"
  | "spoofer_walk"
  | "trojan_idle" | "trojan_open"
  | "botnet_orbit"
  | "zero_day_spin" | "zero_day_dash"
  | "mitm_walk"
  | "fx_snap_ring" | "fx_pop" | "fx_line_break"
  | "ui_data" | "ui_uptime_full" | "ui_uptime_empty"
  | "patch_broadcast" | "patch_rate_limiter" | "patch_vpn_tunnel"
  | "patch_kill_switch" | "patch_kill_switch_used" | "patch_honeypot" | "patch_auto_patch"
  | "patch_overclock" | "patch_wide_snap" | "patch_data_miner" | "patch_backup_server"
  | "env_cloud" | "env_grass" | "env_pebble"
  | BitSkinSpriteName;

export const SkinIds = ["bubblegum", "sprout", "neon", "wizard", "royal"] as const;
export type SkinSpriteId = (typeof SkinIds)[number];
export type BitSkinSpriteName = `bit_${SkinSpriteId}_${"idle" | "draw" | "hurt"}`;

export type SpriteAnim = {
  name: SpriteName;
  frames: number;
  frameMs: number;
  loop: boolean;
};

const table: [SpriteName, number, number, boolean][] = [
  ["bit_idle", 4, 220, true],
  ["bit_draw", 3, 120, true],
  ["bit_hurt", 2, 120, false],
  ["server_idle", 3, 400, true],
  ["server_alert", 2, 300, true],
  ["server_hurt", 3, 80, false],
  ["legit_walk", 2, 180, true],
  ["legit_scared", 2, 120, true],
  ["malware_walk", 2, 180, true],
  ["malware_pop", 3, 70, false],
  ["ping_flood_swarm", 3, 90, true],
  ["worm_crawl", 3, 150, true],
  ["worm_mini_crawl", 3, 130, true],
  ["ransomware_walk", 2, 200, true],
  ["ransomware_cracked", 2, 120, true],
  ["spoofer_walk", 4, 170, true],
  ["trojan_idle", 3, 260, true],
  ["trojan_open", 3, 110, false],
  ["botnet_orbit", 4, 110, true],
  ["zero_day_spin", 4, 70, true],
  ["zero_day_dash", 2, 60, true],
  ["mitm_walk", 4, 190, true],
  ["fx_snap_ring", 3, 120, true],
  ["fx_pop", 3, 60, false],
  ["fx_line_break", 2, 70, false],
  ["ui_data", 1, 0, false],
  ["ui_uptime_full", 1, 0, false],
  ["ui_uptime_empty", 1, 0, false],
  ["patch_broadcast", 1, 0, false],
  ["patch_rate_limiter", 1, 0, false],
  ["patch_vpn_tunnel", 1, 0, false],
  ["patch_kill_switch", 1, 0, false],
  ["patch_kill_switch_used", 1, 0, false],
  ["patch_honeypot", 1, 0, false],
  ["patch_auto_patch", 1, 0, false],
  ["patch_overclock", 1, 0, false],
  ["patch_wide_snap", 1, 0, false],
  ["patch_data_miner", 1, 0, false],
  ["patch_backup_server", 1, 0, false],
  ["env_cloud", 1, 0, false],
  ["env_grass", 1, 0, false],
  ["env_pebble", 1, 0, false],
];

const skinTable: [SpriteName, number, number, boolean][] = SkinIds.flatMap((id) => [
  [`bit_${id}_idle`, 4, 220, true],
  [`bit_${id}_draw`, 3, 120, true],
  [`bit_${id}_hurt`, 2, 120, false],
] as [SpriteName, number, number, boolean][]);

table.push(...skinTable);

export const Sprites = Object.fromEntries(
  table.map(([name, frames, frameMs, loop]) => [name, { name, frames, frameMs, loop }]),
) as Record<SpriteName, SpriteAnim>;

export function spriteUrl(name: SpriteName, frame = 0): string {
  return `/sprites/svg/${name}_${frame}.svg`;
}

export function durationMs(anim: SpriteAnim): number {
  return anim.frames * anim.frameMs;
}

export function frameAt(anim: SpriteAnim, elapsedMs: number): number {
  if (anim.frames <= 1 || anim.frameMs <= 0) return 0;
  const index = Math.floor(Math.max(0, elapsedMs) / anim.frameMs);
  return anim.loop ? index % anim.frames : Math.min(index, anim.frames - 1);
}

export function allSpriteUrls(): string[] {
  return table.flatMap(([name, frames]) => Array.from({ length: frames }, (_, i) => spriteUrl(name, i)));
}
