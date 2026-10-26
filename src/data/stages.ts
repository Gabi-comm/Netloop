import type { PacketKindId } from "@/game/kinds";
import type { LayoutId } from "@/game/network";

export type WaveDef = {
  count: number;
  intervalMs: number;
  legitShare: number;
  mix: Partial<Record<PacketKindId, number>>;
  featured?: PacketKindId[];
  speed?: number;
};

export type Stage = {
  id: number;
  name: string;
  place: string;
  tagline: string;
  layout: LayoutId;
  seed: number;
  reward: number;
  newThreats: PacketKindId[];
  endless?: boolean;
  waves: [WaveDef, WaveDef, WaveDef];
};

export const Stages: Stage[] = [
  {
    id: 1,
    name: "Home Network",
    place: "your living room router",
    tagline: "learn the loop. drop the bad packets.",
    layout: "home",
    seed: 1101,
    reward: 60,
    newThreats: ["malware", "pingFlood"],
    waves: [
      { count: 10, intervalMs: 1500, legitShare: 0.3, mix: { malware: 1 }, featured: ["malware"] },
      { count: 13, intervalMs: 1350, legitShare: 0.3, mix: { malware: 2, pingFlood: 1 }, featured: ["pingFlood"] },
      { count: 15, intervalMs: 1200, legitShare: 0.3, mix: { malware: 2, pingFlood: 2 } },
    ],
  },
  {
    id: 2,
    name: "Coffee Shop Wi-Fi",
    place: "free wi-fi, free trouble",
    tagline: "worms split. spoofers lie.",
    layout: "cafe",
    seed: 2202,
    reward: 90,
    newThreats: ["worm", "spoofer"],
    waves: [
      { count: 12, intervalMs: 1350, legitShare: 0.3, mix: { malware: 2, worm: 1 }, featured: ["worm"] },
      { count: 14, intervalMs: 1250, legitShare: 0.35, mix: { malware: 1, pingFlood: 1, spoofer: 2 }, featured: ["spoofer"] },
      { count: 16, intervalMs: 1150, legitShare: 0.32, mix: { malware: 1, pingFlood: 1, worm: 1, spoofer: 1 } },
    ],
  },
  {
    id: 3,
    name: "School Lab",
    place: "thirty laptops, zero updates",
    tagline: "some locks need two loops.",
    layout: "school",
    seed: 3303,
    reward: 120,
    newThreats: ["ransomware", "trojan"],
    waves: [
      { count: 12, intervalMs: 1300, legitShare: 0.3, mix: { malware: 2, ransomware: 1 }, featured: ["ransomware"] },
      { count: 14, intervalMs: 1250, legitShare: 0.3, mix: { malware: 1, worm: 1, trojan: 2 }, featured: ["trojan"] },
      { count: 17, intervalMs: 1100, legitShare: 0.3, mix: { ransomware: 1, trojan: 1, spoofer: 1, pingFlood: 1 } },
    ],
  },
  {
    id: 4,
    name: "Office HQ",
    place: "the boss clicks every link",
    tagline: "close loops fast. watch who walks together.",
    layout: "office",
    seed: 4404,
    reward: 160,
    newThreats: ["zeroDay", "mitm"],
    waves: [
      { count: 13, intervalMs: 1250, legitShare: 0.3, mix: { malware: 2, zeroDay: 1 }, featured: ["zeroDay"] },
      { count: 15, intervalMs: 1150, legitShare: 0.4, mix: { mitm: 2, malware: 1 }, featured: ["mitm"] },
      { count: 18, intervalMs: 1050, legitShare: 0.32, mix: { zeroDay: 1, mitm: 1, ransomware: 1, worm: 1 } },
    ],
  },
  {
    id: 5,
    name: "Data Center",
    place: "where the whole internet sleeps",
    tagline: "everything at once. loop the hub.",
    layout: "datacenter",
    seed: 5505,
    reward: 220,
    newThreats: ["botnet"],
    waves: [
      { count: 14, intervalMs: 1150, legitShare: 0.28, mix: { malware: 2, botnet: 1 }, featured: ["botnet"] },
      { count: 17, intervalMs: 1050, legitShare: 0.3, mix: { pingFlood: 1, zeroDay: 1, spoofer: 1, trojan: 1, worm: 1 } },
      {
        count: 18, intervalMs: 980, legitShare: 0.3,
        mix: { malware: 1, pingFlood: 1, zeroDay: 1, worm: 1, ransomware: 1, spoofer: 1, trojan: 1, mitm: 1, botnet: 1 },
        featured: ["botnet", "zeroDay"],
      },
    ],
  },
];

export const WAVES_PER_STAGE = 3;

export const ENDLESS_ID = 0;

const ENDLESS_ROTATION: PacketKindId[] = ["zeroDay", "worm", "ransomware", "spoofer", "trojan", "mitm", "botnet", "pingFlood"];

export function endlessWave(wave: number): WaveDef {
  const k = wave - 1;
  const ramp = Math.min(k, 8) / 8;
  return {
    count: Math.min(12 + k * 2, 40),
    intervalMs: Math.max(620, 1250 - k * 55),
    legitShare: 0.3 - ramp * 0.06,
    mix: {
      malware: 3,
      pingFlood: 1.5,
      zeroDay: 1 + ramp,
      worm: 1.5,
      ransomware: 1 + ramp,
      spoofer: 1.5,
      trojan: 1 + ramp,
      mitm: 1 + ramp,
      botnet: 0.6 + ramp,
    },
    featured: [ENDLESS_ROTATION[(k * 2) % ENDLESS_ROTATION.length], ENDLESS_ROTATION[(k * 2 + 1) % ENDLESS_ROTATION.length]],
    speed: Math.min(1 + k * 0.035, 1.9),
  };
}

export const EndlessStage: Stage = {
  id: ENDLESS_ID,
  name: "The Cloud",
  place: "endless traffic, every threat",
  tagline: "every threat. how long can you last?",
  layout: "datacenter",
  seed: 9909,
  reward: 0,
  newThreats: [],
  endless: true,
  waves: [endlessWave(1), endlessWave(2), endlessWave(3)],
};

export function getStage(id: number): Stage | undefined {
  return id === ENDLESS_ID ? EndlessStage : Stages.find((s) => s.id === id);
}

export function waveFor(stage: Stage, wave: number): WaveDef {
  return stage.endless ? endlessWave(wave) : stage.waves[wave - 1];
}

export function endlessReward(wavesSurvived: number, dataEarned: number): number {
  return wavesSurvived * 8 + dataEarned;
}

export function stageThreats(stage: Stage): PacketKindId[] {
  const seen = new Set<PacketKindId>();
  for (const wave of stage.waves) for (const id of Object.keys(wave.mix) as PacketKindId[]) seen.add(id);
  return [...seen];
}

export function stageIntroductions(stage: Stage): PacketKindId[] {
  if (stage.endless) return [];
  return stage.id === Stages[0].id ? ["legit", ...stage.newThreats] : stage.newThreats;
}
