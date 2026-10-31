import { NetColors } from "./colors";
import { Sprites, type SkinSpriteId, type SpriteAnim } from "./sprites";

export type SkinId = "classic" | SkinSpriteId;

export type LineKind = "solid" | "beads" | "vine" | "neon" | "stars" | "ribbon";

export type LineStyle = {
  kind: LineKind;
  color: string;
  edge: string;
  alt?: string;
};

export type SkinAnims = { idle: SpriteAnim; draw: SpriteAnim; hurt: SpriteAnim };

export type Skin = {
  id: SkinId;
  title: string;
  blurb: string;
  lineName: string;
  price: number;
  line: LineStyle;
  accent: string;
  anims: SkinAnims;
};

function animsFor(id: SkinId): SkinAnims {
  if (id === "classic") return { idle: Sprites.bit_idle, draw: Sprites.bit_draw, hurt: Sprites.bit_hurt };
  return { idle: Sprites[`bit_${id}_idle`], draw: Sprites[`bit_${id}_draw`], hurt: Sprites[`bit_${id}_hurt`] };
}

export const Skins: Record<SkinId, Skin> = {
  classic: {
    id: "classic", title: "Classic Bit", price: 0, lineName: "chalk line",
    blurb: "the original little router. draws a plain chalk line",
    line: { kind: "solid", color: NetColors.chalk, edge: NetColors.chalk },
    accent: NetColors.data, anims: animsFor("classic"),
  },
  sprout: {
    id: "sprout", title: "Sprout Bit", price: 200, lineName: "leafy vine",
    blurb: "a tiny seedling grew on his head. his line grows leaves",
    line: { kind: "vine", color: "#8ad15b", edge: "#3f7a2e", alt: "#b6ee86" },
    accent: "#8ad15b", anims: animsFor("sprout"),
  },
  bubblegum: {
    id: "bubblegum", title: "Bubblegum Bit", price: 250, lineName: "candy beads",
    blurb: "pink, puffy and wearing a bow. draws a string of candy beads",
    line: { kind: "beads", color: "#f27aa6", edge: "#8f2a4c", alt: "#f2f2ec" },
    accent: "#f27aa6", anims: animsFor("bubblegum"),
  },
  neon: {
    id: "neon", title: "Neon Bit", price: 400, lineName: "neon tube",
    blurb: "all glow, no fill. his line buzzes like a neon sign",
    line: { kind: "neon", color: "#5fd3e0", edge: "#e0567f" },
    accent: "#5fd3e0", anims: animsFor("neon"),
  },
  wizard: {
    id: "wizard", title: "Wizard Bit", price: 450, lineName: "star trail",
    blurb: "a pointy hat and a little bit of magic. leaves a twinkling star trail",
    line: { kind: "stars", color: "#b39af0", edge: "#6a4fb3", alt: "#ede06a" },
    accent: "#b39af0", anims: animsFor("wizard"),
  },
  royal: {
    id: "royal", title: "Royal Bit", price: 700, lineName: "golden ribbon",
    blurb: "all hail the king of packets. draws a golden ribbon",
    line: { kind: "ribbon", color: "#f3d36b", edge: "#b8871a" },
    accent: "#f3d36b", anims: animsFor("royal"),
  },
};

export const SkinList: Skin[] = Object.values(Skins);

export function skinById(id: string | undefined): Skin {
  return (id && (Skins as Record<string, Skin>)[id]) || Skins.classic;
}

export function skinItemKey(id: SkinId): string {
  return `skin:${id}`;
}

export function ownsSkin(inventory: readonly string[], id: SkinId): boolean {
  return id === "classic" || inventory.includes(skinItemKey(id));
}
