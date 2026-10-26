import { Sprites, type SpriteAnim } from "./sprites";

export type PacketKindId =
  | "legit"
  | "malware"
  | "pingFlood"
  | "zeroDay"
  | "worm"
  | "wormMini"
  | "ransomware"
  | "spoofer"
  | "trojan"
  | "mitm"
  | "botnet";

export type PacketKind = {
  id: PacketKindId;
  label: string;
  caption: string;
  howTo: string;
  isThreat: boolean;
  hp: number;
  speed: number;
  points: number;
  size: number;
  walk: SpriteAnim;
  codex: boolean;
};

export const PacketKinds: Record<PacketKindId, PacketKind> = {
  legit: {
    id: "legit", label: "Legit Packet", caption: "let it pass", howTo: "never loop it. each one that reaches the server is +10",
    isThreat: false, hp: 1, speed: 0.075, points: 10, size: 40, walk: Sprites.legit_walk, codex: true,
  },
  malware: {
    id: "malware", label: "Malware", caption: "basic threat", howTo: "loop it once",
    isThreat: true, hp: 1, speed: 0.07, points: 100, size: 42, walk: Sprites.malware_walk, codex: true,
  },
  pingFlood: {
    id: "pingFlood", label: "Ping Flood", caption: "comes in swarms", howTo: "arrives three at a time. one big loop gets them all",
    isThreat: true, hp: 1, speed: 0.1, points: 30, size: 30, walk: Sprites.ping_flood_swarm, codex: true,
  },
  zeroDay: {
    id: "zeroDay", label: "Zero-Day", caption: "breaks open lines", howTo: "dashes at your open line and cuts it. close loops fast",
    isThreat: true, hp: 1, speed: 0.12, points: 200, size: 40, walk: Sprites.zero_day_spin, codex: true,
  },
  worm: {
    id: "worm", label: "Worm", caption: "splits in two", howTo: "looping it leaves two half worms behind",
    isThreat: true, hp: 1, speed: 0.06, points: 120, size: 46, walk: Sprites.worm_crawl, codex: true,
  },
  wormMini: {
    id: "wormMini", label: "Worm (half)", caption: "what is left of a worm", howTo: "loop it once",
    isThreat: true, hp: 1, speed: 0.08, points: 60, size: 32, walk: Sprites.worm_mini_crawl, codex: false,
  },
  ransomware: {
    id: "ransomware", label: "Ransomware", caption: "loop it twice", howTo: "the first loop cracks the lock, the second drops it",
    isThreat: true, hp: 2, speed: 0.05, points: 250, size: 46, walk: Sprites.ransomware_walk, codex: true,
  },
  spoofer: {
    id: "spoofer", label: "Spoofer", caption: "fake friend", howTo: "looks legit. watch for the red flicker",
    isThreat: true, hp: 1, speed: 0.07, points: 150, size: 42, walk: Sprites.spoofer_walk, codex: true,
  },
  trojan: {
    id: "trojan", label: "Trojan", caption: "opens near server", howTo: "drop it early or it opens into two malware",
    isThreat: true, hp: 1, speed: 0.055, points: 180, size: 46, walk: Sprites.trojan_idle, codex: true,
  },
  mitm: {
    id: "mitm", label: "Man in the Middle", caption: "hides by legit", howTo: "tails a legit packet. loop it without the friend",
    isThreat: true, hp: 1, speed: 0.07, points: 160, size: 42, walk: Sprites.mitm_walk, codex: true,
  },
  botnet: {
    id: "botnet", label: "Botnet Node", caption: "loop the hub", howTo: "three loops around the hub take it down",
    isThreat: true, hp: 3, speed: 0.04, points: 300, size: 56, walk: Sprites.botnet_orbit, codex: true,
  },
};

export const CodexKinds: PacketKind[] = Object.values(PacketKinds).filter((k) => k.codex);
