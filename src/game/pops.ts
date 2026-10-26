import { NetColors } from "./colors";
import type { Vec } from "./geometry";
import type { PacketKindId } from "./kinds";
import type { SpriteAnim } from "./sprites";

export type Pop = { kind: PacketKindId; anim: SpriteAnim; at: Vec; startMs: number; size: number; seed: number };

export const POP_MS = 720;

type Bit = { angle: number; speed: number; spin: number; size: number; color: string; lift: number };

const PURPLE = [NetColors.epic, NetColors.epicLight];
const WOOD = ["#e8b33d", "#f2c95a", "#c98f2a"];

function rng(seed: number) {
  let a = (seed * 2654435761) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function bits(seed: number, count: number, colors: string[], spread = 1, lift = 0): Bit[] {
  const r = rng(seed);
  return Array.from({ length: count }, (_, i) => ({
    angle: (i / count) * Math.PI * 2 + (r() - 0.5) * 0.7 * spread,
    speed: 0.55 + r() * 0.6,
    spin: (r() - 0.5) * 9,
    size: 0.7 + r() * 0.6,
    color: colors[i % colors.length],
    lift: lift * (0.6 + r() * 0.8),
  }));
}

const easeOut = (p: number) => 1 - (1 - p) ** 3;

function flung(b: Bit, at: Vec, size: number, p: number, gravity: number): Vec {
  const d = easeOut(p) * size * 0.75 * b.speed;
  return {
    x: at.x + Math.cos(b.angle) * d,
    y: at.y + Math.sin(b.angle) * d - b.lift * size * p + gravity * size * p * p,
  };
}

function circle(ctx: CanvasRenderingContext2D, at: Vec, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(at.x, at.y, Math.max(0, r), 0, Math.PI * 2);
  ctx.fill();
}

function ring(ctx: CanvasRenderingContext2D, at: Vec, r: number, color: string, width: number) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.arc(at.x, at.y, Math.max(0, r), 0, Math.PI * 2);
  ctx.stroke();
}

function squash(ctx: CanvasRenderingContext2D, img: CanvasImageSource | undefined, ratio: number, at: Vec, size: number, p: number, until = 0.3) {
  if (!img || p >= until) return;
  const k = p / until;
  const grow = k < 0.45 ? 1 + 0.35 * Math.sin((k / 0.45) * Math.PI * 0.5) : 1.35 * (1 - (k - 0.45) / 0.55);
  const w = size * grow * (1 + 0.15 * Math.sin(k * Math.PI));
  const h = size * ratio * grow * (1 - 0.12 * Math.sin(k * Math.PI));
  ctx.globalAlpha = 1 - k * 0.4;
  ctx.drawImage(img, at.x - w / 2, at.y - h / 2, w, h);
  ctx.globalAlpha = 1;
}

export function drawPop(ctx: CanvasRenderingContext2D, pop: Pop, t: number, s: number, img?: HTMLImageElement) {
  const p = Math.min(1, t / POP_MS);
  if (p >= 1) return;
  const { at, size, seed } = pop;
  const fade = 1 - p * p;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  squash(ctx, img, img ? img.naturalHeight / img.naturalWidth : 1, at, size, p);
  ctx.globalAlpha = fade;

  switch (pop.kind) {
    case "pingFlood": {
      for (let i = 0; i < 3; i++) {
        const q = (p - i * 0.14) / 0.7;
        if (q <= 0 || q >= 1) continue;
        ctx.globalAlpha = 1 - q;
        ring(ctx, at, size * (0.15 + 0.75 * easeOut(q)), NetColors.points, 3 * s * (1 - q * 0.6));
      }
      ctx.globalAlpha = fade;
      for (const b of bits(seed, 6, [NetColors.points])) circle(ctx, flung(b, at, size * 1.3, p, 0), 3 * s * b.size * (1 - p), b.color);
      break;
    }
    case "zeroDay": {
      if (p < 0.16) {
        ctx.globalAlpha = 1 - p / 0.16;
        circle(ctx, at, size * (0.35 + p * 2), NetColors.chalk);
        ctx.globalAlpha = fade;
      }
      const turn = p * 1.6;
      for (const [i, b] of bits(seed, 10, [NetColors.pink, NetColors.chalk], 0.3).entries()) {
        const a = b.angle + turn;
        const r1 = size * (0.2 + 0.7 * easeOut(p)) * b.speed;
        const r2 = r1 + size * (i % 2 ? 0.22 : 0.34) * (1 - p);
        ctx.strokeStyle = b.color;
        ctx.lineWidth = (i % 2 ? 2.5 : 3.5) * s;
        ctx.beginPath();
        ctx.moveTo(at.x + Math.cos(a) * r1, at.y + Math.sin(a) * r1);
        ctx.lineTo(at.x + Math.cos(a) * r2, at.y + Math.sin(a) * r2);
        ctx.stroke();
      }
      break;
    }
    case "worm":
    case "wormMini": {
      const mini = pop.kind === "wormMini";
      for (const b of bits(seed, mini ? 3 : 5, PURPLE, 1, 0.9)) {
        const c = flung(b, at, size * 1.2, p, 1.1);
        circle(ctx, c, size * (mini ? 0.13 : 0.15) * b.size * (1 - p * 0.7), b.color);
        circle(ctx, { x: c.x - size * 0.035, y: c.y - size * 0.035 }, size * 0.035 * (1 - p), NetColors.ground);
      }
      ring(ctx, at, size * (0.2 + 0.4 * easeOut(p)), NetColors.epicLight, 2.5 * s * (1 - p));
      break;
    }
    case "ransomware": {
      const lift = easeOut(Math.min(1, p * 1.4));
      ctx.save();
      ctx.translate(at.x + size * 0.2 * p, at.y - size * 0.25 - size * 0.55 * lift + size * 0.9 * p * p);
      ctx.rotate(p * 2.6);
      ctx.strokeStyle = NetColors.points;
      ctx.lineWidth = 4.5 * s;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.2, Math.PI, Math.PI * 2);
      ctx.lineTo(size * 0.2, size * 0.12);
      ctx.stroke();
      ctx.restore();
      for (const b of bits(seed, 7, [NetColors.threat, NetColors.points], 1, 0.5)) {
        const c = flung(b, at, size, p, 1.4);
        const r = size * 0.08 * b.size * (1 - p * 0.5);
        ctx.fillStyle = b.color;
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(b.spin * p);
        ctx.fillRect(-r, -r, r * 2, r * 2);
        ctx.restore();
      }
      sparkle(ctx, { x: at.x - size * 0.3, y: at.y - size * 0.3 }, size * 0.16 * Math.sin(p * Math.PI), NetColors.points, s);
      sparkle(ctx, { x: at.x + size * 0.35, y: at.y - size * 0.1 }, size * 0.12 * Math.sin(Math.min(1, p * 1.3) * Math.PI), NetColors.chalk, s);
      break;
    }
    case "spoofer": {
      if (p < 0.5) {
        const q = p / 0.5;
        ctx.globalAlpha = 1 - q;
        ring(ctx, at, size * (0.3 + 0.5 * easeOut(q)), NetColors.threat, 4 * s);
        ctx.globalAlpha = fade;
      }
      for (const b of bits(seed, 6, [NetColors.legit, "#6fb043"], 1, 0.4)) {
        const c = flung(b, at, size * 0.9, p, 1.6);
        const r = size * 0.13 * b.size;
        ctx.fillStyle = b.color;
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(b.spin * p + b.angle);
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.lineTo(r * 0.9, r * 0.7);
        ctx.lineTo(-r * 0.9, r * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      break;
    }
    case "trojan": {
      for (const b of bits(seed, 6, WOOD, 1, 1.1)) {
        const c = flung(b, at, size * 1.1, p, 1.8);
        ctx.fillStyle = b.color;
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(b.angle + b.spin * p);
        ctx.fillRect(-size * 0.17 * b.size, -size * 0.05, size * 0.34 * b.size, size * 0.1);
        ctx.restore();
      }
      for (const b of bits(seed + 7, 5, [NetColors.pink], 1, 0.3)) circle(ctx, flung(b, at, size * 0.8, p, 0.2), size * 0.09 * b.size * (1 - p), b.color);
      break;
    }
    case "mitm": {
      for (const b of bits(seed, 6, ["#8b7fb0", "#a79cc9", NetColors.soft], 1, 0.35)) {
        const c = flung(b, at, size * 0.7, p, 0);
        ctx.globalAlpha = fade * fade * 0.8;
        circle(ctx, c, size * (0.12 + 0.2 * easeOut(p)) * b.size, b.color);
      }
      ctx.globalAlpha = fade;
      const ey = at.y - size * 0.05 - size * 0.25 * p;
      circle(ctx, { x: at.x - size * 0.1, y: ey }, size * 0.045, NetColors.chalk);
      circle(ctx, { x: at.x + size * 0.1, y: ey }, size * 0.045, NetColors.chalk);
      break;
    }
    case "botnet": {
      const nodes = bits(seed, 6, [NetColors.threat], 0.2);
      if (p < 0.4) {
        ctx.globalAlpha = 1 - p / 0.4;
        ctx.strokeStyle = NetColors.soft;
        ctx.lineWidth = 2 * s;
        ctx.setLineDash([4 * s, 4 * s]);
        for (const b of nodes) {
          const c = flung(b, at, size * 1.2, p, 0);
          ctx.beginPath();
          ctx.moveTo(at.x, at.y);
          ctx.lineTo(c.x, c.y);
          ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.globalAlpha = fade;
      }
      for (const b of nodes) {
        const c = flung(b, at, size * 1.2, p, 0.3);
        circle(ctx, c, size * 0.09 * (1 - p * 0.6), b.color);
        circle(ctx, c, size * 0.035 * (1 - p), NetColors.ground);
      }
      for (const b of bits(seed + 3, 4, ["#55555e"], 1, 0.4)) {
        const c = flung(b, at, size * 0.6, p, 1.5);
        const r = size * 0.07 * b.size;
        ctx.fillStyle = b.color;
        ctx.fillRect(c.x - r, c.y - r, r * 2, r * 2);
      }
      break;
    }
    default: {
      for (const b of bits(seed, 8, [NetColors.threat, NetColors.points])) circle(ctx, flung(b, at, size, p, 0.2), size * 0.1 * (1 - p * 0.8), b.color);
      ring(ctx, at, size * (0.2 + 0.45 * easeOut(p)), NetColors.threat, 3 * s * (1 - p));
    }
  }
  ctx.restore();
}

function sparkle(ctx: CanvasRenderingContext2D, at: Vec, r: number, color: string, s: number) {
  if (r <= 0.5) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5 * s;
  ctx.beginPath();
  ctx.moveTo(at.x - r, at.y);
  ctx.lineTo(at.x + r, at.y);
  ctx.moveTo(at.x, at.y - r);
  ctx.lineTo(at.x, at.y + r);
  ctx.stroke();
}
