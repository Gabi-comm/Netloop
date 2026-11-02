import { stageIntroductions } from "@/data/stages";
import { NetColors } from "./colors";
import { centroid, distance, minDistance, pathLength, pointInPolygon, type Vec } from "./geometry";
import { PacketKinds, type PacketKind, type PacketKindId } from "./kinds";
import { buildCables, Layouts, type Cable, type NetworkLayout } from "./network";
import { POP_MS, type Pop } from "./pops";
import { honeypotCooldownS, patchValue } from "./patches";
import { currentWave, hasPatch, killSwitchCharges, patchLevel, patchPower, type RunState } from "./runState";
import { durationMs, Sprites, type SpriteAnim } from "./sprites";
import { buildWave, threatCount, type Spawn } from "./wavePlan";
import type { SfxName } from "@/lib/sfx";

export type FightPhase = "playing" | "paused" | "briefing" | "cleared" | "lost";

export type Packet = {
  id: number;
  kind: PacketKind;
  cable: number;
  progress: number;
  bornMs: number;
  hp: number;
  position: Vec;
  lastHitMs: number;
  openingAtMs: number | null;
  dashing: boolean;
};

export type Effect = { anim: SpriteAnim; at: Vec; startMs: number; size: number };

export type Popup = { text: string; at: Vec; startMs: number; color: string; big?: boolean };

export type Hud = {
  phase: FightPhase;
  score: number;
  combo: number;
  uptime: number;
  maxUptime: number;
  bandwidth: number;
  drawing: boolean;
  waveProgress: number;
  threatsLeft: number;
  killSwitchOwned: boolean;
  killSwitchCharges: number;
  honeypotOwned: boolean;
  honeypotReady: boolean;
  honeypotCooldown: number;
  briefing: PacketKindId | null;
};

const TROJAN_OPEN_AT = 0.72;
const MITM_PEEL_AT = 0.65;

export class GameEngine {
  readonly run: RunState;
  readonly layout: NetworkLayout;

  phase: FightPhase = "playing";
  score: number;
  combo = 1;
  uptime: number;
  bandwidth = 1;

  clockMs = 0;
  serverHurtAtMs = -1e9;
  serverHappyAtMs = -1e9;
  width = 0;
  height = 0;
  scale = 1;
  cables: Cable[] = [];
  drawing = false;
  pointer: Vec | null = null;

  readonly packets: Packet[] = [];
  readonly effects: Effect[] = [];
  readonly pops: Pop[] = [];
  readonly popups: Popup[] = [];
  readonly line: Vec[] = [];

  private readonly spawns: Spawn[];
  private readonly totalThreats: number;
  private resolvedThreats = 0;
  private nextId = 0;
  private vpnCharge: number;
  private freezeUntilMs = 0;
  private honeypotReadyAtMs = 0;
  private readonly known: Set<PacketKindId>;
  private readonly introduces: Set<PacketKindId>;
  private readonly speed: number;
  private readonly briefings: PacketKindId[] = [];
  private hudListener: ((hud: Hud) => void) | null = null;
  private sfxListener: ((name: SfxName, level?: number) => void) | null = null;
  private lastHudKey = "";

  constructor(run: RunState, known: Iterable<PacketKindId> = []) {
    this.run = run;
    this.known = new Set([...run.briefed, ...known]);
    this.introduces = new Set(stageIntroductions(run.stage));
    this.layout = Layouts[run.stage.layout];
    this.score = run.score;
    this.uptime = run.uptime;
    this.vpnCharge = patchPower(run, "vpnTunnel");
    const def = currentWave(run);
    this.spawns = buildWave(def, this.layout.routes.length, run.rng);
    this.speed = def.speed ?? 1;
    this.totalThreats = Math.max(1, threatCount(this.spawns));
  }

  get snapRadius(): number {
    return 30 * this.scale * (1 + patchPower(this.run, "wideSnap") / 100);
  }

  private get honeypotCooldownMs(): number {
    return honeypotCooldownS(patchLevel(this.run, "honeypot")) * 1000;
  }

  get isFrozen(): boolean {
    return this.clockMs < this.freezeUntilMs;
  }

  get serverPosition(): Vec {
    return { x: this.width * this.layout.server.x, y: this.height * this.layout.server.y };
  }

  get threatsNearServer(): boolean {
    return this.packets.some((p) => p.kind.isThreat && p.progress > 0.75);
  }

  private get inkMax(): number {
    return this.width * 1.8 * (1 + patchPower(this.run, "broadcast") / 100);
  }

  onHud(listener: ((hud: Hud) => void) | null) {
    this.hudListener = listener;
    this.lastHudKey = "";
    this.emitHud();
  }

  onSfx(listener: ((name: SfxName, level?: number) => void) | null) {
    this.sfxListener = listener;
  }

  private sfx(name: SfxName, level?: number) {
    this.sfxListener?.(name, level);
  }

  hud(): Hud {
    const remaining = this.spawns.filter((s) => PacketKinds[s.kind].isThreat).length;
    const alive = this.packets.filter((p) => p.kind.isThreat).length;
    const honeypotOwned = hasPatch(this.run, "honeypot");
    return {
      phase: this.phase,
      score: this.score,
      combo: this.combo,
      uptime: this.uptime,
      maxUptime: this.run.maxUptime,
      bandwidth: this.bandwidth,
      drawing: this.drawing,
      waveProgress: Math.max(0, Math.min(1, this.resolvedThreats / (this.resolvedThreats + remaining + alive || 1))),
      threatsLeft: remaining + alive,
      killSwitchOwned: hasPatch(this.run, "killSwitch"),
      killSwitchCharges: killSwitchCharges(this.run),
      honeypotOwned,
      honeypotReady: honeypotOwned && this.clockMs >= this.honeypotReadyAtMs,
      honeypotCooldown: honeypotOwned ? Math.max(0, (this.honeypotReadyAtMs - this.clockMs) / this.honeypotCooldownMs) : 0,
      briefing: this.briefings[0] ?? null,
    };
  }

  private emitHud() {
    if (!this.hudListener) return;
    const hud = this.hud();
    const key = [
      hud.phase, hud.score, hud.combo, hud.uptime, Math.round(hud.bandwidth * 40), hud.drawing, Math.round(hud.waveProgress * 20), hud.threatsLeft,
      hud.killSwitchCharges, hud.honeypotReady, Math.round(hud.honeypotCooldown * 20), hud.briefing,
    ].join("|");
    if (key === this.lastHudKey) return;
    this.lastHudKey = key;
    this.hudListener(hud);
  }

  setSize(width: number, height: number) {
    if (width === this.width && height === this.height) return;
    this.width = width;
    this.height = height;
    this.scale = Math.max(0.8, Math.min(1.5, width / 390));
    this.cables = buildCables(this.layout, width, height);
    for (const p of this.packets) p.position = this.cables[p.cable].pointAt(p.progress);
  }

  pause() {
    if (this.phase !== "playing") return;
    this.phase = "paused";
    this.cancelLine();
    this.emitHud();
  }

  resume() {
    if (this.phase !== "paused") return;
    this.phase = "playing";
    this.emitHud();
  }

  update(dtMs: number) {
    if (this.phase !== "playing" || this.width === 0) return;
    this.clockMs += dtMs;
    const dt = dtMs / 1000;

    while (this.spawns.length && this.spawns[0].atMs <= this.clockMs) this.spawn(this.spawns.shift()!);
    if (this.briefings.length) {
      this.phase = "briefing";
      this.cancelLine();
      this.sfx("briefing");
      this.emitHud();
      return;
    }

    const slow = this.drawing ? 1 - patchPower(this.run, "rateLimiter") / 100 : 1;
    const frozen = this.isFrozen;
    const opened: Packet[] = [];

    for (let i = this.packets.length - 1; i >= 0; i--) {
      const p = this.packets[i];
      const cable = this.cables[p.cable];
      const step = (p.kind.speed * this.speed * slow * dt * this.height) / cable.length;

      if (p.openingAtMs !== null) {
        if (this.clockMs - p.openingAtMs >= durationMs(Sprites.trojan_open)) {
          this.packets.splice(i, 1);
          opened.push(p);
        }
        continue;
      }

      if (!(frozen && p.kind.isThreat)) p.progress += this.speedFactor(p) * step;
      p.position = cable.pointAt(p.progress);

      if (p.kind.id === "trojan" && p.progress >= TROJAN_OPEN_AT) {
        p.openingAtMs = this.clockMs;
        this.popups.push({ text: "trojan!", at: p.position, startMs: this.clockMs, color: NetColors.points });
        this.sfx("trojan");
        continue;
      }

      if (p.progress >= 1) {
        this.packets.splice(i, 1);
        this.reachServer(p);
        if (this.phase !== "playing") return;
        continue;
      }

      if (p.kind.id === "zeroDay") {
        const near = this.drawing && this.line.length > 1 ? minDistance(p.position, this.line) : Infinity;
        p.dashing = near < 90 * this.scale;
        if (near < 22 * this.scale && this.clockMs - p.lastHitMs > 1000) this.zeroDayHit(p);
      }
    }

    for (const trojan of opened) this.releaseTrojan(trojan);

    if (!this.drawing) this.bandwidth = Math.min(1, this.bandwidth + 0.35 * (1 + patchPower(this.run, "overclock") / 100) * dt);
    this.prune(this.effects, (e) => this.clockMs - e.startMs > Math.max(durationMs(e.anim), 200));
    this.prune(this.pops, (p) => this.clockMs - p.startMs > POP_MS);
    this.prune(this.popups, (p) => this.clockMs - p.startMs > (p.big ? 1400 : 900));

    if (this.phase === "playing" && this.spawns.length === 0 && !this.packets.some((p) => p.kind.isThreat)) this.finishWave();
    this.emitHud();
  }

  private speedFactor(p: Packet): number {
    if (p.kind.id === "zeroDay" && p.dashing) return 1.8;
    if (p.kind.id === "mitm" && p.progress < MITM_PEEL_AT) {
      let target: Packet | null = null;
      for (const q of this.packets) {
        if (q.kind.id !== "legit" || q.cable !== p.cable) continue;
        const gap = q.progress - p.progress;
        if (gap > 0 && gap < 0.25 && (!target || q.progress < target.progress)) target = q;
      }
      if (target) {
        const gap = target.progress - p.progress;
        return gap > 0.14 ? 1.4 : (target.kind.speed / p.kind.speed) * 0.96;
      }
    }
    if (p.kind.id === "mitm") return 0.85;
    return 1;
  }

  dismissBriefing() {
    if (this.phase !== "briefing") return;
    this.briefings.shift();
    if (!this.briefings.length) this.phase = "playing";
    this.emitHud();
  }

  startLine(at: Vec) {
    this.pointer = at;
    if (this.phase !== "playing") return;
    if (this.bandwidth < 0.05) {
      this.popups.push({ text: "no bandwidth!", at, startMs: this.clockMs, color: NetColors.data });
      this.sfx("noBandwidth");
      return;
    }
    this.line.length = 0;
    this.line.push(at);
    this.drawing = true;
    this.sfx("draw");
  }

  extendLine(at: Vec) {
    this.pointer = at;
    if (!this.drawing) return;
    const step = distance(at, this.line[this.line.length - 1]);
    if (step < 4 * this.scale) return;
    this.bandwidth -= step / this.inkMax;
    if (this.bandwidth <= 0) {
      this.bandwidth = 0;
      this.breakLine(at, "out of bandwidth");
      return;
    }
    this.line.push(at);
    if (this.line.length > 8 && pathLength(this.line) > this.width * 0.35 && distance(at, this.line[0]) < this.snapRadius) {
      this.closeLoop();
    }
  }

  endLine() {
    this.pointer = null;
    if (!this.drawing) return;
    if (this.line.length > 8 && distance(this.line[this.line.length - 1], this.line[0]) < this.snapRadius * 1.6) this.closeLoop();
    else this.cancelLine();
  }

  useKillSwitch() {
    if (killSwitchCharges(this.run) === 0 || this.phase !== "playing") return;
    this.run.killSwitchSpent++;
    const dropped = this.packets.filter((p) => p.kind.isThreat);
    for (const p of dropped) this.drop(p, 1);
    this.removeAll(dropped);
    const lockdownMs = patchValue("killSwitch", patchLevel(this.run, "killSwitch")) * 1000;
    if (lockdownMs) this.freezeUntilMs = Math.max(this.freezeUntilMs, this.clockMs + lockdownMs);
    this.sfx("killSwitch");
    this.popups.push({ text: "KILL SWITCH", at: { x: this.width / 2, y: this.height * 0.45 }, startMs: this.clockMs, color: NetColors.threat, big: true });
    this.emitHud();
  }

  useHoneypot() {
    if (!hasPatch(this.run, "honeypot") || this.clockMs < this.honeypotReadyAtMs || this.phase !== "playing") return;
    this.freezeUntilMs = Math.max(this.freezeUntilMs, this.clockMs + patchPower(this.run, "honeypot") * 1000);
    this.honeypotReadyAtMs = this.clockMs + this.honeypotCooldownMs;
    this.sfx("honeypot");
    this.popups.push({ text: "honeypot!", at: { x: this.width / 2, y: this.height * 0.45 }, startMs: this.clockMs, color: NetColors.epicLight, big: true });
    this.emitHud();
  }

  private spawn(s: Spawn) {
    const kind = PacketKinds[s.kind];
    if (this.introduces.has(kind.id) && !this.known.has(kind.id)) {
      this.known.add(kind.id);
      this.run.briefed.push(kind.id);
      this.briefings.push(kind.id);
    }
    const progress = s.progress ?? 0;
    const p: Packet = {
      id: this.nextId++,
      kind,
      cable: s.cable,
      progress,
      bornMs: this.clockMs,
      hp: kind.hp,
      position: this.cables.length ? this.cables[s.cable].pointAt(progress) : { x: 0, y: 0 },
      lastHitMs: -1e9,
      openingAtMs: null,
      dashing: false,
    };
    this.packets.push(p);
  }

  private spawnChild(kind: PacketKindId, cable: number, progress: number) {
    this.spawn({ kind, atMs: this.clockMs, cable, progress: Math.max(0, Math.min(0.98, progress)) });
  }

  private reachServer(p: Packet) {
    if (p.kind.isThreat) {
      this.resolvedThreats++;
      if (this.run.rng.next() * 100 < patchPower(this.run, "backupServer")) {
        this.serverHappyAtMs = this.clockMs;
        this.popups.push({ text: "backup held", at: this.serverPosition, startMs: this.clockMs, color: NetColors.rare });
        this.sfx("vpn");
        return;
      }
      this.run.breaches.push(p.kind.id);
      this.uptime -= 1;
      this.combo = 1;
      this.serverHurtAtMs = this.clockMs;
      this.popups.push({ text: "-1 uptime", at: this.serverPosition, startMs: this.clockMs, color: NetColors.threat });
      this.sfx("breach");
      this.sfx("hurt");
      if (this.uptime <= 0) {
        this.uptime = 0;
        this.phase = "lost";
        this.sfx("lost");
        this.cancelLine();
        this.commitToRun();
        this.emitHud();
      }
    } else {
      this.score += p.kind.points;
      this.run.dataEarned += 1;
      this.serverHappyAtMs = this.clockMs;
      this.popups.push({ text: `+${p.kind.points}`, at: this.serverPosition, startMs: this.clockMs, color: NetColors.legit });
      this.sfx("deliver");
    }
  }

  private zeroDayHit(p: Packet) {
    p.lastHitMs = this.clockMs;
    this.popups.push({ text: "zero-day!", at: p.position, startMs: this.clockMs, color: NetColors.pink });
    this.sfx("zeroDay");
    if (this.vpnCharge > 0) {
      this.vpnCharge--;
      this.sfx("vpn");
      this.popups.push({ text: "VPN held", at: this.line[this.line.length - 1], startMs: this.clockMs, color: NetColors.rare });
    } else {
      this.breakLine(p.position);
    }
  }

  private releaseTrojan(p: Packet) {
    this.effects.push({ anim: Sprites.fx_pop, at: p.position, startMs: this.clockMs, size: 60 * this.scale });
    this.resolvedThreats++;
    this.spawnChild("malware", p.cable, p.progress - 0.03);
    this.spawnChild("malware", p.cable, p.progress + 0.03);
  }

  private closeLoop() {
    const loop = [...this.line];
    this.drawing = false;
    this.line.length = 0;
    this.effects.push({ anim: Sprites.fx_pop, at: loop[0], startMs: this.clockMs, size: 70 * this.scale });

    let dropped = 0;
    let hitLegit = false;
    let cracked = false;
    const removed: Packet[] = [];
    const worms: Packet[] = [];
    for (const p of this.packets) {
      if (!pointInPolygon(p.position, loop)) continue;
      if (!p.kind.isThreat) {
        hitLegit = true;
        continue;
      }
      p.hp -= 1;
      p.lastHitMs = this.clockMs;
      if (p.hp > 0) {
        cracked = true;
        continue;
      }
      dropped++;
      this.drop(p, this.combo);
      removed.push(p);
      if (p.kind.id === "worm") worms.push(p);
    }
    this.removeAll(removed);
    for (const w of worms) {
      this.spawnChild("wormMini", w.cable, w.progress - 0.16);
      this.spawnChild("wormMini", w.cable, w.progress - 0.08);
      this.popups.push({ text: "split!", at: w.position, startMs: this.clockMs + 120, color: NetColors.epicLight });
    }
    if (worms.length) this.sfx("split");

    if (hitLegit) {
      this.combo = 1;
      this.score = Math.max(0, this.score - 50);
      this.popups.push({ text: "-50 legit!", at: centroid(loop), startMs: this.clockMs, color: NetColors.threat });
      this.sfx("legitHit");
    } else if (dropped > 0) {
      this.sfx("loop", this.combo);
      this.combo = Math.min(this.combo + 1, 5);
    } else if (cracked) {
      this.popups.push({ text: "cracked!", at: centroid(loop), startMs: this.clockMs, color: NetColors.points });
      this.sfx("cracked");
    } else {
      this.sfx("miss");
    }
  }

  private drop(p: Packet, multiplier: number) {
    const gain = p.kind.points * multiplier;
    this.score += gain;
    this.resolvedThreats++;
    this.run.dropped++;
    this.pops.push({
      kind: p.kind.id,
      anim: p.kind.id === "spoofer" ? Sprites.spoofer_walk : this.spriteFor(p),
      at: { ...p.position },
      startMs: this.clockMs,
      size: p.kind.size * this.scale * (p.kind.id === "botnet" ? 1.5 : 1.3),
      seed: p.id + 1,
    });
    if (p.kind.id === "malware") this.effects.push({ anim: Sprites.malware_pop, at: p.position, startMs: this.clockMs, size: p.kind.size * this.scale * 1.4 });
    this.popups.push({ text: `+${gain}`, at: p.position, startMs: this.clockMs, color: NetColors.points });
  }

  private breakLine(at: Vec, reason?: string) {
    this.effects.push({ anim: Sprites.fx_line_break, at, startMs: this.clockMs, size: 60 * this.scale });
    this.sfx("lineBreak");
    if (reason) this.popups.push({ text: reason, at, startMs: this.clockMs, color: NetColors.muted });
    this.combo = 1;
    this.cancelLine();
  }

  private cancelLine() {
    this.drawing = false;
    this.line.length = 0;
  }

  private finishWave() {
    this.phase = "cleared";
    this.cancelLine();
    this.sfx("win");
    if (hasPatch(this.run, "autoPatch")) {
      const regain = this.run.rng.next() * 100 < patchPower(this.run, "autoPatch") ? 2 : 1;
      this.uptime = Math.min(this.run.maxUptime, this.uptime + regain);
    }
    this.commitToRun();
  }

  private commitToRun() {
    this.run.score = this.score;
    this.run.uptime = this.uptime;
  }

  private removeAll(items: Packet[]) {
    const ids = new Set(items.map((p) => p.id));
    for (let i = this.packets.length - 1; i >= 0; i--) if (ids.has(this.packets[i].id)) this.packets.splice(i, 1);
  }

  private prune<T>(list: T[], expired: (item: T) => boolean) {
    for (let i = list.length - 1; i >= 0; i--) if (expired(list[i])) list.splice(i, 1);
  }

  spriteFor(p: Packet): SpriteAnim {
    if (p.openingAtMs !== null) return Sprites.trojan_open;
    switch (p.kind.id) {
      case "ransomware":
        return p.hp < p.kind.hp ? Sprites.ransomware_cracked : p.kind.walk;
      case "zeroDay":
        return p.dashing ? Sprites.zero_day_dash : p.kind.walk;
      case "spoofer":
        return (this.clockMs - p.bornMs) % 1800 > 1350 ? Sprites.spoofer_walk : Sprites.legit_walk;
      default:
        return p.kind.walk;
    }
  }
}
