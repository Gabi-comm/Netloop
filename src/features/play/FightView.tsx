"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { HoneypotIcon, PowerIcon } from "@/components/Icons";
import { Sprite } from "@/components/Sprite";
import { ChunkyButton, UptimeBars } from "@/components/ui";
import { GameEngine, type Hud } from "@/game/engine";
import { waveFor } from "@/data/stages";
import { PacketKinds } from "@/game/kinds";
import { PlayfieldRenderer, SpriteCache } from "@/game/renderer";
import type { RunState } from "@/game/runState";
import { progressStore } from "@/lib/progress";
import { BandwidthMeter } from "./BandwidthMeter";
import { EnemyBriefing } from "./EnemyBriefing";
import { PatchStrip } from "./PatchStrip";
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
  const [hud, setHud] = useState<Hud>(() => engine.hud());
  const [comboBump, setComboBump] = useState(false);
  const lastCombo = useRef(hud.combo);
  const callbacks = useRef({ onCleared, onLost });
  callbacks.current = { onCleared, onLost };

  useEffect(() => {
    engine.onHud(setHud);
    return () => engine.onHud(null);
  }, [engine]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const renderer = new PlayfieldRenderer(sprites, run.stage.seed + run.wave);
    const font = getComputedStyle(document.documentElement).getPropertyValue("--font-gochi").trim();
    renderer.setFont(font ? `${font}, cursive` : "cursive");

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
    const tick = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;
      engine.update(dt);
      renderer.draw(ctx, engine);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onVisibility = () => document.hidden && engine.pause();
    document.addEventListener("visibilitychange", onVisibility);
    const onKey = (e: KeyboardEvent) => {
      if (engine.phase === "briefing") return;
      if (e.key === "Escape" || e.key === "p") engine.phase === "paused" ? engine.resume() : engine.pause();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("keydown", onKey);
    };
  }, [engine, run, sprites]);

  useEffect(() => {
    if (hud.phase === "cleared") {
      const t = window.setTimeout(() => callbacks.current.onCleared(), 1100);
      return () => window.clearTimeout(t);
    }
    if (hud.phase === "lost") {
      const t = window.setTimeout(() => callbacks.current.onLost(), 900);
      return () => window.clearTimeout(t);
    }
  }, [hud.phase]);

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
  const def = waveFor(run.stage, run.wave);
  const featured = run.wave === 1 && !endless ? run.stage.newThreats : (def.featured ?? []);
  const where = endless ? "endless" : `zone ${run.stage.id}`;
  const lit = Math.round(hud.waveProgress * SEGMENTS);

  return (
    <div className={styles.stage} ref={containerRef}>
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
            <div className={styles.segments} aria-hidden="true">
              {Array.from({ length: SEGMENTS }, (_, i) => (
                <div key={i} className={`${styles.segment} ${i < lit ? styles.segmentOn : ""}`} />
              ))}
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
        </div>

        <div className={styles.hudRow}>
          <UptimeBars value={hud.uptime} max={hud.maxUptime} />
          <span className={`${styles.combo} ${hud.combo > 1 ? "" : styles.comboIdle} ${comboBump ? styles.comboBump : ""}`}>
            x{hud.combo} combo
          </span>
        </div>

        <BandwidthMeter value={hud.bandwidth} drawing={hud.drawing} />

        <PatchStrip patches={run.patches} />
      </div>

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
                aria-label={hud.killSwitchUsed ? "Kill Switch, used this run" : "Use Kill Switch"}
                className={styles.abilityButton}
                style={{ border: "3px solid var(--threat)" }}
                disabled={hud.killSwitchUsed}
                onClick={() => engine.useKillSwitch()}
              >
                <PowerIcon color={hud.killSwitchUsed ? "#7a7a74" : "var(--threat)"} />
              </button>
              <span className={styles.abilityLabel} style={{ color: hud.killSwitchUsed ? "var(--muted)" : "var(--threat)" }}>
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
        <span className={styles.bannerSub}>{run.wave === 1 ? run.stage.tagline : run.wave === run.maxWaves ? "final wave!" : "keep the server up"}</span>
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
        <div className={styles.clearFlash}>
          <h2>{run.wave === run.maxWaves ? "ZONE CLEAR!" : "WAVE CLEAR!"}</h2>
        </div>
      )}

      {hud.phase === "briefing" && hud.briefing && (
        <EnemyBriefing kindId={hud.briefing} onDismiss={() => engine.dismissBriefing()} />
      )}

      {hud.phase === "paused" && (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Paused">
          <h2 className={styles.overlayTitle}>PAUSED</h2>
          <p className={styles.overlaySub}>
            {endless ? `the cloud · wave ${run.wave}` : `${where} · wave ${run.wave} of ${run.maxWaves}`}
          </p>
          <ChunkyButton onClick={() => engine.resume()}>RESUME</ChunkyButton>
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
