import { NetColors } from "./colors";
import type { GameEngine } from "./engine";
import { pointInPolygon, type Vec } from "./geometry";
import { drawBitLine } from "./bitLine";
import { Skins, type Skin } from "./skins";
import { drawPop } from "./pops";
import { allSpriteUrls, frameAt, spriteUrl, Sprites, type SpriteAnim } from "./sprites";

export class SpriteCache {
  private readonly images = new Map<string, HTMLImageElement>();

  load(): Promise<void> {
    const urls = allSpriteUrls();
    return Promise.all(
      urls.map(
        (url) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.decoding = "async";
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = url;
            this.images.set(url, img);
          }),
      ),
    ).then(() => undefined);
  }

  get(anim: SpriteAnim, elapsedMs: number): HTMLImageElement | undefined {
    const img = this.images.get(spriteUrl(anim.name, frameAt(anim, elapsedMs)));
    return img && img.complete && img.naturalWidth > 0 ? img : undefined;
  }
}

type Decor = { x: number; y: number; kind: "grass" | "pebble"; size: number };

function makeDecor(seed: number): Decor[] {
  let s = seed;
  const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: 14 }, (_, i) => ({
    x: rand(),
    y: 0.08 + rand() * 0.7,
    kind: i % 3 === 0 ? "pebble" : "grass",
    size: 16 + rand() * 10,
  }));
}

const SERVER_HIT_MS = 700;


export class PlayfieldRenderer {
  private readonly sprites: SpriteCache;
  private readonly decor: Decor[];
  private displayFont = "cursive";
  private skin: Skin = Skins.classic;
  private readonly tints = new Map<string, HTMLCanvasElement>();

  constructor(sprites: SpriteCache, seed: number) {
    this.sprites = sprites;
    this.decor = makeDecor(seed);
  }

  setSkin(skin: Skin) {
    this.skin = skin;
  }

  setFont(family: string) {
    if (family) this.displayFont = family;
  }

  private sprite(ctx: CanvasRenderingContext2D, anim: SpriteAnim, elapsed: number, at: Vec, size: number, alpha = 1) {
    const img = this.sprites.get(anim, elapsed);
    if (!img) return;
    const h = size * (img.naturalHeight / img.naturalWidth);
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, at.x - size / 2, at.y - h / 2, size, h);
    ctx.globalAlpha = 1;
  }

  private tinted(img: HTMLImageElement, color: string): HTMLCanvasElement {
    const key = `${img.src}|${color}`;
    let canvas = this.tints.get(key);
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth * 2;
      canvas.height = img.naturalHeight * 2;
      const c = canvas.getContext("2d")!;
      c.drawImage(img, 0, 0, canvas.width, canvas.height);
      c.globalCompositeOperation = "source-atop";
      c.fillStyle = color;
      c.fillRect(0, 0, canvas.width, canvas.height);
      this.tints.set(key, canvas);
    }
    return canvas;
  }

  private serverHit(ctx: CanvasRenderingContext2D, anim: SpriteAnim, t: number, at: Vec, size: number, s: number) {
    const img = this.sprites.get(anim, t);
    if (!img) return;
    const k = t / SERVER_HIT_MS;
    const squash = t < 140 ? Math.sin((t / 140) * Math.PI) : 0;
    const shake = Math.sin(t * 0.075) * 7 * s * (1 - k) ** 2;
    const red = Math.max(0, 1 - t / 460) ** 1.3 * 0.85;
    const blue = t > 360 ? Math.sin(((t - 360) / (SERVER_HIT_MS - 360)) * Math.PI) * 0.45 : 0;
    const h = size * (img.naturalHeight / img.naturalWidth);
    ctx.save();
    ctx.translate(at.x + shake, at.y + h / 2);
    ctx.scale(1 + squash * 0.14, 1 - squash * 0.16);
    const x = -size / 2;
    const y = -h;
    ctx.drawImage(img, x, y, size, h);
    if (red > 0.01) {
      ctx.globalAlpha = red;
      ctx.drawImage(this.tinted(img, NetColors.threat), x, y, size, h);
    }
    if (blue > 0.01) {
      ctx.globalAlpha = blue;
      ctx.drawImage(this.tinted(img, NetColors.serverLight), x, y, size, h);
    }
    ctx.restore();
  }

  draw(ctx: CanvasRenderingContext2D, engine: GameEngine) {
    const { width: w, height: h, scale: s, clockMs: now } = engine;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = NetColors.ground;
    ctx.fillRect(0, 0, w, h);

    for (const d of this.decor) {
      this.sprite(ctx, d.kind === "grass" ? Sprites.env_grass : Sprites.env_pebble, 0, { x: d.x * w, y: d.y * h }, d.size * s, 0.9);
    }

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = NetColors.cable;
    ctx.lineWidth = 5 * s;
    for (const cable of engine.cables) {
      ctx.beginPath();
      cable.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();
    }

    const server = engine.serverPosition;
    const sinceHit = now - engine.serverHurtAtMs;
    this.serverBase(ctx, server, w, s, now, engine.threatsNearServer, sinceHit);
    const hurt = sinceHit < 260;
    const serverAnim = hurt ? Sprites.server_hurt : engine.threatsNearServer ? Sprites.server_alert : Sprites.server_idle;
    if (sinceHit < SERVER_HIT_MS) this.serverHit(ctx, serverAnim, sinceHit, server, 96 * s, s);
    else this.sprite(ctx, serverAnim, now, { x: server.x, y: server.y }, 96 * s);
    const bitAnim = hurt ? this.skin.anims.hurt : engine.drawing ? this.skin.anims.draw : this.skin.anims.idle;
    this.sprite(ctx, bitAnim, hurt ? now - engine.serverHurtAtMs : now, { x: server.x - 92 * s, y: server.y + 22 * s }, 64 * s);

    const openLine = engine.drawing && engine.line.length > 6 ? engine.line : null;
    const frozen = engine.isFrozen;
    for (const p of engine.packets) {
      let anim = engine.spriteFor(p);
      if (p.kind.id === "legit" && openLine && pointInPolygon(p.position, openLine)) anim = Sprites.legit_scared;
      const flash = now - p.lastHitMs < 160;
      const size = p.kind.size * s * (p.kind.id === "botnet" ? 1.25 : 1);
      this.sprite(ctx, anim, frozen && p.kind.isThreat ? 0 : now - p.bornMs, p.position, size, flash ? 0.55 : 1);
      if (p.kind.hp > 1) this.hpPips(ctx, p.position, size, p.hp, p.kind.hp, s);
      if (frozen && p.kind.isThreat) {
        ctx.strokeStyle = NetColors.epicLight;
        ctx.lineWidth = 2.5 * s;
        ctx.setLineDash([5 * s, 5 * s]);
        ctx.beginPath();
        ctx.arc(p.position.x, p.position.y, size * 0.62, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    if (engine.line.length > 1) {
      drawBitLine(ctx, engine.line, this.skin.line, s, now);
      this.sprite(ctx, Sprites.fx_snap_ring, now, engine.line[0], engine.snapRadius * 2.4);
    }

    if (engine.pointer && engine.drawing) this.bandwidthRing(ctx, engine.pointer, engine.bandwidth, s, this.skin.accent);

    for (const pop of engine.pops) drawPop(ctx, pop, now - pop.startMs, s, this.sprites.get(pop.anim, now - pop.startMs));
    for (const e of engine.effects) this.sprite(ctx, e.anim, now - e.startMs, e.at, e.size);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const p of engine.popups) {
      const t = (now - p.startMs) / (p.big ? 1400 : 900);
      if (t < 0) continue;
      ctx.globalAlpha = Math.max(0, 1 - t * t);
      ctx.fillStyle = p.color;
      ctx.font = `${(p.big ? 44 : 26) * s}px ${this.displayFont}`;
      ctx.save();
      ctx.translate(p.at.x, p.at.y - 26 * s - t * 34 * s);
      ctx.rotate(-0.1);
      ctx.fillText(p.text, 0, 0);
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    if (frozen) {
      ctx.fillStyle = "rgba(155, 122, 214, 0.08)";
      ctx.fillRect(0, 0, w, h);
    }
  }

  private serverBase(ctx: CanvasRenderingContext2D, server: Vec, w: number, s: number, now: number, alert: boolean, sinceHit: number) {
    const cx = server.x;
    const top = server.y + 40 * s;
    const rx = Math.min(w * 0.44, 165 * s);
    const ry = 21 * s;
    const depth = 16 * s;
    const hit = sinceHit < SERVER_HIT_MS ? 1 - sinceHit / SERVER_HIT_MS : 0;
    const accent = alert || hit > 0 ? NetColors.threat : NetColors.serverLight;

    const glow = ctx.createRadialGradient(cx, top - 30 * s, 10 * s, cx, top - 30 * s, rx * 1.1);
    glow.addColorStop(0, alert || hit > 0 ? "rgba(232, 85, 61, 0.22)" : "rgba(59, 111, 212, 0.2)");
    glow.addColorStop(1, "rgba(59, 111, 212, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(cx - rx * 1.2, top - 30 * s - rx * 1.2, rx * 2.4, rx * 2.4);

    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.beginPath();
    ctx.ellipse(cx, top + depth + 8 * s, rx * 1.02, ry * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#16203a";
    ctx.beginPath();
    ctx.ellipse(cx, top + depth, rx, ry, 0, 0, Math.PI);
    ctx.lineTo(cx - rx, top);
    ctx.ellipse(cx, top, rx, ry, 0, Math.PI, 0, true);
    ctx.closePath();
    ctx.fill();

    const leds = 7;
    for (let i = 0; i < leds; i++) {
      const a = Math.PI * (0.18 + (0.64 * i) / (leds - 1));
      const lx = cx + Math.cos(a) * rx * 0.97;
      const ly = top + depth * 0.5 + Math.sin(a) * ry;
      const on = Math.floor(now / (alert ? 110 : 260)) % leds === i;
      ctx.fillStyle = on ? (alert ? NetColors.threat : NetColors.data) : "#2a3a63";
      ctx.beginPath();
      ctx.arc(lx, ly, 2.6 * s, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#1f2c50";
    ctx.beginPath();
    ctx.ellipse(cx, top, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.9;
    ctx.lineWidth = 3 * s;
    ctx.stroke();

    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = NetColors.chalk;
    ctx.lineWidth = 2 * s;
    ctx.setLineDash([6 * s, 7 * s]);
    ctx.beginPath();
    ctx.ellipse(cx, top, rx * 0.72, ry * 0.68, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    const period = alert ? 900 : 2200;
    const q = (now % period) / period;
    ctx.globalAlpha = (1 - q) * (alert ? 0.7 : 0.45);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2.5 * s;
    ctx.beginPath();
    ctx.ellipse(cx, top, rx * (0.25 + 0.75 * q), ry * (0.25 + 0.75 * q), 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.beginPath();
    ctx.ellipse(cx, top + 2 * s, 34 * s, 8 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(cx - 92 * s, top + 4 * s, 22 * s, 6 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private hpPips(ctx: CanvasRenderingContext2D, at: Vec, size: number, hp: number, max: number, s: number) {
    const gap = 9 * s;
    const startX = at.x - ((max - 1) * gap) / 2;
    for (let i = 0; i < max; i++) {
      ctx.fillStyle = i < hp ? NetColors.points : NetColors.line;
      ctx.beginPath();
      ctx.arc(startX + i * gap, at.y - size * 0.62, 3.2 * s, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private bandwidthRing(ctx: CanvasRenderingContext2D, at: Vec, bandwidth: number, s: number, accent: string) {
    const r = 27 * s;
    const cx = at.x;
    const cy = at.y - 64 * s;
    ctx.lineWidth = 6 * s;
    ctx.strokeStyle = NetColors.cable;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = bandwidth < 0.25 ? NetColors.threat : accent;
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, bandwidth));
    ctx.stroke();
    ctx.fillStyle = NetColors.chalk;
    ctx.beginPath();
    ctx.arc(cx, cy, 10 * s, 0, Math.PI * 2);
    ctx.fill();
  }
}
