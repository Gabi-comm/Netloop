import type { Rarity } from "./patches";
import { Sprites, type SpriteAnim } from "./sprites";

export type ItemId =
  | "zeroTrust"
  | "repairKit"
  | "packetFreeze"
  | "throttle"
  | "overdrive"
  | "wideNet"
  | "scoreSurge"
  | "dataSiphon"
  | "purge"
  | "reboot";

export type Item = {
  id: ItemId;
  title: string;
  rarity: Rarity;
  price: number;
  short: string;
  description: string;
  icon: SpriteAnim;
  color: string;
  durationS?: number;
};

export const MAX_ITEM_STOCK = 5;
export const ZERO_TRUST_SHIELDS = 3;

export const Items: Record<ItemId, Item> = {
  zeroTrust: {
    id: "zeroTrust", title: "Zero Trust Protocol", rarity: "epic", price: 350, short: "zero trust", color: "#5fd3e0", icon: Sprites.item_zero_trust,
    description: "puts up 3 shields around the server. each shield blocks one threat that gets through",
  },
  reboot: {
    id: "reboot", title: "Reboot Token", rarity: "epic", price: 250, short: "reboot", color: "#8ad15b", icon: Sprites.item_reboot,
    description: "arm it, and if the network would go down it reboots with 2 uptime instead",
  },
  purge: {
    id: "purge", title: "EMP Pulse", rarity: "rare", price: 200, short: "emp", color: "#e0567f", icon: Sprites.item_purge,
    description: "drops every threat on the screen right now and scores them",
  },
  dataSiphon: {
    id: "dataSiphon", title: "Data Siphon", rarity: "rare", price: 150, short: "siphon", color: "#5fd3e0", icon: Sprites.item_data_siphon,
    description: "+50% data from packets for the rest of the run",
  },
  packetFreeze: {
    id: "packetFreeze", title: "Packet Freeze", rarity: "common", price: 100, short: "freeze", color: "#b8e6ff", icon: Sprites.item_packet_freeze, durationS: 6,
    description: "freezes every threat in place for 6 seconds",
  },
  repairKit: {
    id: "repairKit", title: "Repair Kit", rarity: "common", price: 90, short: "repair", color: "#e8553d", icon: Sprites.item_repair_kit,
    description: "fixes 1 uptime right away",
  },
  throttle: {
    id: "throttle", title: "Throttle", rarity: "common", price: 90, short: "throttle", color: "#ede06a", icon: Sprites.item_throttle, durationS: 10,
    description: "all packets move at half speed for 10 seconds",
  },
  scoreSurge: {
    id: "scoreSurge", title: "Score Surge", rarity: "common", price: 80, short: "surge", color: "#ede06a", icon: Sprites.item_score_surge, durationS: 15,
    description: "double points for 15 seconds",
  },
  overdrive: {
    id: "overdrive", title: "Overdrive", rarity: "common", price: 70, short: "overdrive", color: "#ede06a", icon: Sprites.item_overdrive, durationS: 10,
    description: "unlimited bandwidth for 10 seconds",
  },
  wideNet: {
    id: "wideNet", title: "Wide Net", rarity: "common", price: 60, short: "wide net", color: "#8ad15b", icon: Sprites.item_wide_net, durationS: 15,
    description: "loops snap shut from twice as far away for 15 seconds",
  },
};

const RARITY_ORDER: Record<Rarity, number> = { common: 0, rare: 1, epic: 2 };

export const ItemList: Item[] = Object.values(Items).sort(
  (a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity] || a.price - b.price,
);

export function isItemId(id: string): id is ItemId {
  return Object.prototype.hasOwnProperty.call(Items, id);
}

export function ownedItems(stock: Record<string, number>): ItemId[] {
  return ItemList.filter((item) => (stock[item.id] ?? 0) > 0).map((item) => item.id);
}
