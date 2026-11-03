"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { HoneypotIcon, PowerIcon } from "@/components/Icons";
import { Sprite } from "@/components/Sprite";
import { AudioSettings, settingsStyles } from "@/components/AudioSettings";
import { ChunkyButton, Sheet, UptimeBars } from "@/components/ui";
import { GameEngine, type Hud } from "@/game/engine";
import { Items, type ItemId } from "@/game/items";
import { PacketKinds } from "@/game/kinds";
import { PlayfieldRenderer, SpriteCache } from "@/game/renderer";
import { currentWave, type RunState } from "@/game/runState";
import { skinById, teleportCue } from "@/game/skins";
import { frameAt } from "@/game/sprites";
import { progressStore } from "@/lib/progress";
import { music } from "@/lib/music";
import { playSfx, unlockAudio } from "@/lib/sfx";
import { BandwidthMeter } from "./BandwidthMeter";
import { CLEAR_MS, ClearCelebration } from "./ClearCelebration";
import { EnemyBriefing } from "./EnemyBriefing";
import { PatchStrip } from "./PatchStrip";
import { ZoneBackdrop } from "./ZoneBackdrop";
import styles from "./play.module.css";

type FightViewProps = {
  run: RunState;
  sprites: SpriteCache;
  onCleared: () => void;
  onLost: () => void;
  onRestart: () => void;
  onQuit: () => void;
};

const SEGMENTS = 10;

export function FightView({ run, sprites, onCleared, onLost, onRestart, onQuit }: FightViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [engine] = useState(() => new GameEngine(run));
  const [skin] = useState(() => skinById(progressStore.get().equippedSkin));
  const [bestScore] = useState(() => progressStore.get().endless.bestScore);
  const [hud, setHud] = useState<Hud>(() => engine.hud());
  const [comboBump, setComboBump] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsOpenRef = useRef(false);
  settingsOpenRef.current = settingsOpen;
  const lastCombo = useRef(hud.combo);
  const useItem = (id: ItemId) => {
    if (engine.useItem(id)) progressStore.useConsumable(id);
  };
  const callbacks = useRef({ onCleared, onLost });
  callbacks.current = { onCleared, onLost };

  useEffect(() => {
    engine.onHud(setHud);
    engine.onSfx(playSfx);
    return () => {
      engine.onHud(null);
      engine.onSfx(null);
    };
  }, [engine]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const renderer = new PlayfieldRenderer(sprites);
    const font = getComputedStyle(document.documentElement).getPropertyValue("--font-gochi").trim();
    renderer.setFont(font ? `${font}, cursive` : "cursive");
    renderer.setSkin(skin);

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      engine.setSize(rect.width, rect.height);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    let raf = 0;
    let last = performance.now();
    let lastBitFrame = -1;
    const tick = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;
      engine.update(dt);
      renderer.draw(ctx, engine);
      if (skin.teleport) {
        const calm = !engine.drawing && engine.clockMs - engine.serverHurtAtMs >= 260 && engine.phase === "playing";
        const frame = calm ? frameAt(skin.anims.idle, engine.clockMs) : -1;
        if (frame !== lastBitFrame) {
          const cue = teleportCue(skin, frame);
          if (cue !== null) playSfx("glitch", cue);
          lastBitFrame = frame;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onVisibility = () => document.hidden && engine.pause();
    document.addEventListener("visibilitychange", onVisibility);
    const onKey = (e: KeyboardEvent) => {
      if (engine.phase === "briefing" || settingsOpenRef.current) return;
      if (e.key === "Escape" || e.key === "p") engine.phase === "paused" ? engine.resume() : engine.pause();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("keydown", onKey);
    };
  }, [engine, run, sprites, skin]);

  useEffect(() => {
    if (hud.phase === "cleared") {
      const t = window.setTimeout(() => callbacks.current.onCleared(), CLEAR_MS);
      return () => window.clearTimeout(t);
    }
    if (hud.phase === "lost") {
      music.duck(true);
      const t = window.setTimeout(() => callbacks.current.onLost(), 900);
      return () => window.clearTimeout(t);
    }
  }, [hud.phase]);

  useEffect(() => {
    if (hud.phase !== "paused") setSettingsOpen(false);
  }, [hud.phase]);

  useEffect(() => {
    playSfx("wave", run.wave === run.maxWaves ? 1 : 0, run.wave > 1 ? 280 : 60);
  }, [run]);

  useEffect(() => {
    if (hud.briefing) progressStore.markSeen(hud.briefing);
  }, [hud.briefing]);

  useEffect(() => {
    if (hud.combo > lastCombo.current) {
      setComboBump(true);
      const t = window.setTimeout(() => setComboBump(false), 380);
      lastCombo.current = hud.combo;
      return () => window.clearTimeout(t);
    }
    lastCombo.current = hud.combo;
  }, [hud.combo]);

  const toLocal = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    unlockAudio();
    engine.startLine(toLocal(e));
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (e.buttons === 0 && e.pointerType === "mouse") return;
    const events = typeof e.nativeEvent.getCoalescedEvents === "function" ? e.nativeEvent.getCoalescedEvents() : [];
    if (events.length > 1) {
      const rect = e.currentTarget.getBoundingClientRect();
      for (const ev of events) engine.extendLine({ x: ev.clientX - rect.left, y: ev.clientY - rect.top });
    } else {
      engine.extendLine(toLocal(e));
    }
  };
  const onPointerUp = () => engine.endLine();

  const endless = Boolean(run.stage.endless);
  const def = currentWave(run);
  const featured = run.wave === 1 && !endless ? run.stage.newThreats : (def.featured ?? []);
  const where = endless ? "endless" : `zone ${run.stage.id}`;
  const lit = Math.round(hud.waveProgress * SEGMENTS);

  return (
    <div className={styles.stage} ref={containerRef}>
      <ZoneBackdrop layout={run.stage.layout} endless={endless} />
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        aria-label="Playfield. Drag to draw a loop around threats."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />

      <div className={styles.hud}>
        <div className={styles.hudRow}>
          <div className={styles.waveBlock}>
            <span className={styles.waveLabel}>
              WAVE {run.wave}
              <span className={styles.waveOf}> / {endless ? "∞" : run.maxWaves}</span>
            </span>
            <div className={styles.progressRow}>
              <div className={styles.segments} aria-hidden="true">
                {Array.from({ length: SEGMENTS }, (_, i) => (
                  <div key={i} className={`${styles.segment} ${i < lit ? styles.segmentOn : ""}`} />
                ))}
              </div>
              <span className={styles.threatsLeft}>
                {hud.threatsLeft} {hud.threatsLeft === 1 ? "threat" : "threats"} left
              </span>
            </div>
            <span className={styles.zoneName}>{where} · {run.stage.name.toLowerCase()}</span>
          </div>
          <button
            type="button"
            aria-label="Pause"
            className={styles.abilityButton}
            style={{ width: 46, height: 46, borderRadius: 14, border: "2.5px solid var(--line)", gap: 6 }}
            onClick={() => engine.pause()}
          >
            <span style={{ width: 5, height: 18, borderRadius: 2, background: "var(--chalk)" }} />
            <span style={{ width: 5, height: 18, borderRadius: 2, background: "var(--chalk)" }} />
          </button>
        </div>

        <div className={styles.scoreBlock} aria-live="polite">
          <span className={styles.score}>{hud.score.toLocaleString()}</span>
          <span className={styles.scoreLabel}>score</span>
          {endless && bestScore > 0 && (
            hud.score > bestScore ? (
              <span className={`${styles.bestChip} ${styles.bestChipBeat}`}>NEW BEST!</span>
            ) : (
              <span className={styles.bestChip}>best {bestScore.toLocaleString()}</span>
            )
          )}
        </div>

        <div className={styles.hudRow}>
          <UptimeBars value={hud.uptime} max={hud.maxUptime} />
          <span className={`${styles.combo} ${hud.combo > 1 ? "" : styles.comboIdle} ${comboBump ? styles.comboBump : ""}`}>
            x{hud.combo} combo
          </span>
        </div>

        <BandwidthMeter value={hud.bandwidth} drawing={hud.drawing} skin={skin} />

        <PatchStrip patches={run.patches} levels={run.levels} />
      </div>

      {hud.items.length > 0 && (
        <div className={styles.itemTray} role="group" aria-label="One-use items">
          {hud.items.map((id) => {
            const item = Items[id];
            const used = hud.itemsUsed.includes(id);
            const active = hud.itemsActive.includes(id);
            const state = id === "zeroTrust" && hud.shields > 0 ? `${hud.shields} shields up` : active ? "active" : used ? "used" : "ready";
            return (
              <div key={id} className={styles.itemSlot}>
                <button
                  type="button"
                  aria-label={`${item.title}, ${state}`}
                  title={item.description}
                  className={`${styles.itemButton} ${active ? styles.itemActive : ""}`}
                  style={{ "--item": item.color } as CSSProperties}
                  disabled={used || hud.phase !== "playing"}
                  onClick={() => useItem(id)}
                >
                  <Sprite anim={item.icon} size={30} />
                  {id === "zeroTrust" && hud.shields > 0 && (
                    <span className={styles.abilityCount} style={{ background: item.color }} aria-hidden="true">×{hud.shields}</span>
                  )}
                </button>
                <span className={styles.itemLabel} style={{ color: used && !active ? "var(--muted)" : item.color }}>
                  {id === "reboot" && hud.reviveArmed ? "armed" : item.short}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {(hud.honeypotOwned || hud.killSwitchOwned) && (
        <div className={styles.abilities}>
          {hud.honeypotOwned ? (
            <div className={styles.ability}>
              <button
                type="button"
                aria-label={hud.honeypotReady ? "Use Honeypot" : "Honeypot recharging"}
                className={styles.abilityButton}
                style={{ border: "3px solid var(--epic)" }}
                disabled={!hud.honeypotReady}
                onClick={() => engine.useHoneypot()}
              >
                {!hud.honeypotReady && (
                  <svg aria-hidden="true" className={styles.cooldown} viewBox="0 0 72 72">
                    <circle cx="36" cy="36" r="33" fill="none" stroke="var(--epic-light)" strokeWidth="4" strokeLinecap="round"
                      pathLength={100} strokeDasharray={`${(1 - hud.honeypotCooldown) * 100} 100`} transform="rotate(-90 36 36)" />
                  </svg>
                )}
                <HoneypotIcon color={hud.honeypotReady ? "var(--epic-light)" : "var(--muted)"} />
              </button>
              <span className={styles.abilityLabel} style={{ color: "var(--epic-light)" }}>honeypot</span>
            </div>
          ) : (
            <span />
          )}
          {hud.killSwitchOwned ? (
            <div className={styles.ability}>
              <button
                type="button"
                aria-label={hud.killSwitchCharges > 0 ? `Use Kill Switch, ${hud.killSwitchCharges} left` : "Kill Switch, all used"}
                className={styles.abilityButton}
                style={{ border: "3px solid var(--threat)" }}
                disabled={hud.killSwitchCharges === 0}
                onClick={() => engine.useKillSwitch()}
              >
                <PowerIcon color={hud.killSwitchCharges === 0 ? "#7a7a74" : "var(--threat)"} />
                {hud.killSwitchCharges > 1 && (
                  <span className={styles.abilityCount} aria-hidden="true">×{hud.killSwitchCharges}</span>
                )}
              </button>
              <span className={styles.abilityLabel} style={{ color: hud.killSwitchCharges === 0 ? "var(--muted)" : "var(--threat)" }}>
                kill switch
              </span>
            </div>
          ) : (
            <span />
          )}
        </div>
      )}

      <div className={styles.banner} key={`banner-${run.wave}`}>
        <h2 className={styles.bannerTitle}>WAVE {run.wave}</h2>
        {run.wave > 1 && <span className={styles.bannerSub}>{run.wave === run.maxWaves ? "final wave!" : "keep the server up"}</span>}
        {featured.length > 0 && (
          <div className={styles.newRow}>
            {featured.map((id) => (
              <span key={id} className={styles.newCard}>
                <Sprite anim={PacketKinds[id].walk} size={38} />
                <em>{endless ? "HOT" : "NEW"}</em> {PacketKinds[id].label}
              </span>
            ))}
          </div>
        )}
      </div>

      {hud.phase === "cleared" && (
        <ClearCelebration title={run.wave === run.maxWaves ? "CONGRATULATIONS!" : "WAVE CLEAR!"} />
      )}

      {hud.phase === "briefing" && hud.briefing && (
        <EnemyBriefing kindId={hud.briefing} onDismiss={() => engine.dismissBriefing()} />
      )}

      <Sheet open={settingsOpen && hud.phase === "paused"} onClose={() => setSettingsOpen(false)} label="Settings">
        <h2 className={settingsStyles.title}>SETTINGS</h2>
        <AudioSettings />
        <ChunkyButton tone="pink" size="small" onClick={() => setSettingsOpen(false)}>
          DONE
        </ChunkyButton>
      </Sheet>

      {hud.phase === "paused" && (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Paused">
          <h2 className={styles.overlayTitle}>PAUSED</h2>
          <p className={styles.overlaySub}>
            {endless ? `the cloud · wave ${run.wave}` : `${where} · wave ${run.wave} of ${run.maxWaves}`}
          </p>
          <ChunkyButton onClick={() => engine.resume()}>RESUME</ChunkyButton>
          <ChunkyButton tone="ghost" size="small" onClick={() => setSettingsOpen(true)}>
            settings
          </ChunkyButton>
          <ChunkyButton tone="ghost" size="small" onClick={onRestart}>
            {endless ? "restart run" : "restart zone"}
          </ChunkyButton>
          <ChunkyButton tone="ghost" size="small" onClick={onQuit}>
            {endless ? "back to home" : "back to zones"}
          </ChunkyButton>
        </div>
      )}
    </div>
  );
}
