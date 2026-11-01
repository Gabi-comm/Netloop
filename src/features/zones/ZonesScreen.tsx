"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { LockIcon, PlayIcon, StarIcon } from "@/components/Icons";
import { Sprite } from "@/components/Sprite";
import { ChunkyLink, DataPill, Screen, Sheet, TopBar } from "@/components/ui";
import { Stages, stageThreats, WAVES_PER_STAGE, type Stage } from "@/data/stages";
import { PacketKinds } from "@/game/kinds";
import { clearedCount, isStageUnlocked, nextStageId, progressStore, useHydrated, useProgress, type Progress } from "@/lib/progress";
import { ZoneBadge, ZoneScene } from "./ZoneScenes";
import styles from "./zones.module.css";

type NodeState = "locked" | "open" | "cleared";

function nodeState(progress: Progress, stage: Stage): NodeState {
  if (progress.stages[stage.id]) return "cleared";
  return isStageUnlocked(progress, stage.id) ? "open" : "locked";
}

function Stars({ count, size = 18 }: { count: number; size?: number }) {
  return (
    <span className={styles.stars} aria-label={`${count} of 3 stars`}>
      {[0, 1, 2].map((i) => (
        <StarIcon key={i} size={size} filled={i < count} />
      ))}
    </span>
  );
}

type Point = { x: number; y: number; r: number };

function Trail({ points, litUntil, reveal }: { points: Point[]; litUntil: number; reveal: number | null }) {
  if (points.length < 2) return null;
  const seg = (a: Point, b: Point) => {
    const y1 = a.y + a.r + 10;
    const y2 = b.y - b.r - 10;
    const h = y2 - y1;
    return { start: `M${a.x} ${y1}`, curve: `C${a.x} ${y1 + h * 0.75} ${b.x} ${y2 - h * 0.75} ${b.x} ${y2}` };
  };
  const pieces = points.slice(1).map((b, i) => {
    const { start, curve } = seg(points[i], b);
    return { i, d: `${start} ${curve}`, lit: i + 1 <= litUntil };
  });
  const litPath = litUntil > 0 ? pieces.slice(0, litUntil).map((p) => p.d).join(" ") : null;
  return (
    <svg aria-hidden="true" className={styles.trail}>
      {pieces.map((p) => (
        <path key={`b${p.i}`} d={p.d} fill="none" stroke="#0b0b0b" strokeOpacity="0.85" strokeWidth="11" strokeLinecap="round" />
      ))}
      {pieces.map((p) => (
        <path
          key={`d${p.i}`}
          d={p.d}
          fill="none"
          stroke={p.lit ? "var(--chalk)" : "var(--line-strong)"}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="9 9"
          className={`${p.lit ? styles.trailFlow : ""} ${reveal === p.i + 1 ? styles.trailReveal : ""}`}
        />
      ))}
      {litPath && (
        <g>
          <circle r="9" fill="var(--data)" opacity="0.25">
            <animateMotion dur={`${1.6 + litUntil * 1.1}s`} repeatCount="indefinite" path={litPath} />
          </circle>
          <circle r="4.5" fill="var(--data)">
            <animateMotion dur={`${1.6 + litUntil * 1.1}s`} repeatCount="indefinite" path={litPath} />
          </circle>
        </g>
      )}
    </svg>
  );
}

export function ZonesScreen() {
  const progress = useProgress();
  const hydrated = useHydrated();
  const [selected, setSelected] = useState<Stage | null>(null);
  const [celebrate, setCelebrate] = useState<number | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const worldRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const scrolled = useRef(false);

  useLayoutEffect(() => {
    const world = worldRef.current;
    if (!world) return;
    const measure = () => {
      const box = world.getBoundingClientRect();
      setPoints(
        nodeRefs.current.flatMap((el) => {
          if (!el) return [];
          const r = el.getBoundingClientRect();
          return [{ x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2, r: el.offsetWidth / 2 }];
        }),
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(world);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const id = progressStore.consumeLastCleared();
    if (id !== null) setCelebrate(id);
  }, []);

  useEffect(() => {
    if (celebrate === null) return;
    const t = window.setTimeout(() => setCelebrate(null), 2600);
    return () => window.clearTimeout(t);
  }, [celebrate]);

  const cleared = clearedCount(progress);
  const current = nextStageId(progress);

  useEffect(() => {
    if (!hydrated || scrolled.current) return;
    scrolled.current = true;
    if (current > 2) nodeRefs.current[current - 1]?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [hydrated, current]);
  const stars = Stages.reduce((n, stage) => n + (progress.stages[stage.id]?.stars ?? 0), 0);
  const unlockedByCelebration = celebrate !== null && celebrate < Stages.length ? celebrate + 1 : null;
  const litUntil = Stages.reduce((n, stage, i) => (i > 0 && isStageUnlocked(progress, stage.id) ? i : n), 0);

  return (
    <Screen>
      <TopBar title="ZONES" right={<DataPill />} />

      <div className={styles.summary}>
        <div className={styles.summaryStat}>
          <span className={styles.summaryValue}>
            {hydrated ? cleared : 0}
            <span className={styles.summaryOf}>/{Stages.length}</span>
          </span>
          <span className={styles.summaryLabel}>secured</span>
        </div>
        <ol className={styles.pips} aria-label={`${hydrated ? cleared : 0} of ${Stages.length} zones secured`}>
          {Stages.map((stage) => {
            const state = hydrated ? nodeState(progress, stage) : stage.id === 1 ? "open" : "locked";
            return (
              <li key={stage.id} className={`${styles.pip} ${styles[`pip_${state}`]} ${hydrated && stage.id === current && state === "open" ? styles.pipCurrent : ""}`}>
                <ZoneBadge layout={stage.layout} />
              </li>
            );
          })}
        </ol>
        <div className={styles.summaryStat}>
          <span className={styles.summaryValue}>
            <StarIcon size={20} />
            {hydrated ? stars : 0}
          </span>
          <span className={styles.summaryLabel}>of {Stages.length * 3}</span>
        </div>
      </div>

      {celebrate !== null && (
        <div className={styles.toast} role="status">
          {unlockedByCelebration ? `zone ${celebrate} secured · ${Stages[celebrate].name} unlocked!` : "every zone secured. nice work, Bit!"}
        </div>
      )}

      <div className={styles.world} ref={worldRef}>
        <Trail points={points} litUntil={hydrated ? litUntil : 0} reveal={unlockedByCelebration ? unlockedByCelebration - 1 : null} />
        <ol className={styles.map}>
          {Stages.map((stage, index) => {
            const state = hydrated ? nodeState(progress, stage) : stage.id === 1 ? "open" : "locked";
            const record = progress.stages[stage.id];
            const left = index % 2 === 0;
            const isCurrent = hydrated && state === "open" && stage.id === current;
            const popping = celebrate === stage.id || unlockedByCelebration === stage.id;
            return (
              <li
                key={stage.id}
                className={`${styles.scene} ${state === "locked" ? styles.sceneLocked : ""} ${left ? styles.sceneFromLeft : styles.sceneFromRight}`}
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <ZoneScene layout={stage.layout} />
                <div className={`${styles.shade} ${left ? styles.shadeLeft : styles.shadeRight}`} />
                {index > 0 && (
                  <svg aria-hidden="true" className={styles.seam} viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 0 L100 10" stroke="#0a0a0a" strokeWidth="6" vectorEffect="non-scaling-stroke" />
                    <path d="M0 1.2 L100 11.2" stroke="#f2f2ec" strokeOpacity="0.14" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                  </svg>
                )}
                <div className={`${styles.stop} ${left ? styles.left : styles.right}`}>
                  <button
                    type="button"
                    ref={(el) => {
                      nodeRefs.current[index] = el;
                    }}
                    className={`${styles.node} ${styles[state]} ${isCurrent ? styles.current : ""} ${popping ? styles.pop : ""}`}
                    onClick={() => setSelected(stage)}
                    aria-label={`Zone ${stage.id}, ${stage.name}, ${state === "locked" ? "locked" : state === "cleared" ? "cleared" : "ready"}`}
                  >
                    <ZoneBadge layout={stage.layout} />
                    {state === "locked" ? (
                      <span className={styles.nodeLock}>
                        <LockIcon size={26} color="var(--chalk)" />
                      </span>
                    ) : (
                      <span className={styles.nodeNumber}>{stage.id}</span>
                    )}
                  </button>
                  <div className={styles.label}>
                    <span className={styles.kicker}>
                      ZONE {stage.id}
                      {isCurrent && <span className={styles.nextTag}>next up</span>}
                    </span>
                    <span className={styles.labelName}>{stage.name}</span>
                    {state === "locked" ? (
                      <span className={styles.lockHint}>
                        <LockIcon size={14} color="var(--muted)" /> clear {Stages[index - 1]?.name.toLowerCase()} first
                      </span>
                    ) : (
                      <span className={styles.threatRow}>
                        {stageThreats(stage)
                          .filter((id) => PacketKinds[id].isThreat)
                          .map((id) => (
                            <span key={id} className={`${styles.threatChip} ${stage.newThreats.includes(id) ? styles.threatChipNew : ""}`} title={PacketKinds[id].label}>
                              <Sprite anim={PacketKinds[id].walk} size={22} label={PacketKinds[id].label} playing={false} />
                            </span>
                          ))}
                        {state === "cleared" && record && <Stars count={record.stars} size={15} />}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <Link href="/endless" className={styles.beyond}>
        <svg aria-hidden="true" className={styles.beyondArt} viewBox="0 0 360 120" preserveAspectRatio="xMidYMid slice">
          <rect width="360" height="120" fill="#1b1830" />
          <g fill="#b39af0">
            <circle className={styles.twinkle} cx="40" cy="22" r="1.8" />
            <circle className={styles.twinkle} style={{ animationDelay: "0.6s" }} cx="120" cy="14" r="1.4" />
            <circle className={styles.twinkle} style={{ animationDelay: "1.1s" }} cx="250" cy="20" r="1.8" />
            <circle className={styles.twinkle} style={{ animationDelay: "0.3s" }} cx="330" cy="34" r="1.4" />
          </g>
          <g className={styles.drift}>
            <path d="M30 96 Q14 96 16 82 Q18 70 32 72 Q36 56 54 58 Q72 58 74 74 Q90 72 90 86 Q90 96 76 96 Z" fill="#2c2850" />
            <path d="M220 104 Q204 104 206 90 Q208 78 222 80 Q226 64 244 66 Q262 66 264 82 Q280 80 280 94 Q280 104 266 104 Z" fill="#2c2850" />
          </g>
          <g className={styles.driftSlow}>
            <path d="M130 70 Q118 70 120 60 Q122 52 132 53 Q136 42 150 43 Q164 44 165 56 Q176 55 176 64 Q176 70 166 70 Z" fill="#3a3466" />
            <path d="M300 64 Q290 64 291 56 Q292 49 300 50 Q303 42 314 42 Q325 43 326 52 Q334 52 334 58 Q334 64 326 64 Z" fill="#3a3466" />
          </g>
        </svg>
        <span className={styles.beyondText}>
          <span className={styles.kicker}>BEYOND THE DATA CENTER</span>
          <span className={styles.beyondTitle}>THE CLOUD</span>
        </span>
        <span className={styles.beyondGo} aria-hidden="true">
          <PlayIcon size={22} />
        </span>
      </Link>

      <Sheet open={selected !== null} onClose={() => setSelected(null)} label={selected ? `Zone ${selected.id} details` : "Zone"}>
        {selected && <ZoneDetail stage={selected} progress={progress} />}
      </Sheet>
    </Screen>
  );
}

function ZoneDetail({ stage, progress }: { stage: Stage; progress: Progress }) {
  const state = nodeState(progress, stage);
  const record = progress.stages[stage.id];
  const threats = stageThreats(stage).filter((id) => PacketKinds[id].isThreat);
  return (
    <>
      <div className={styles.detailHead}>
        <span className={styles.detailZone}>ZONE {stage.id}</span>
        <h2 className={styles.detailName}>{stage.name}</h2>
        <p className={styles.detailTagline}>{stage.tagline}</p>
      </div>

      <div className={styles.facts}>
        <div className={styles.fact}>
          <span className={styles.factValue}>{WAVES_PER_STAGE}</span>
          <span className={styles.factLabel}>waves</span>
        </div>
        <div className={styles.fact}>
          <span className={styles.factValue}>{record ? record.best.toLocaleString() : "—"}</span>
          <span className={styles.factLabel}>best</span>
        </div>
        <div className={styles.fact}>
          <span className={styles.factValue}>+{stage.reward}</span>
          <span className={styles.factLabel}>data reward</span>
        </div>
      </div>

      <div className={styles.threatHead}>
        <span>threats in this zone</span>
        {record && <Stars count={record.stars} />}
      </div>
      <ul className={styles.threats}>
        {threats.map((id) => {
          const kind = PacketKinds[id];
          const isNew = stage.newThreats.includes(id);
          return (
            <li key={id} className={styles.threat}>
              {isNew && <span className={styles.newTag}>NEW</span>}
              <Sprite anim={kind.walk} size={52} label={kind.label} />
              <span className={styles.threatName}>{kind.label}</span>
              <span className={styles.threatCaption}>{kind.caption}</span>
            </li>
          );
        })}
      </ul>

      {state === "locked" ? (
        <ChunkyLink href="#" disabled size="small">
          <LockIcon color="var(--ground)" /> clear zone {stage.id - 1} first
        </ChunkyLink>
      ) : (
        <ChunkyLink href={`/play/${stage.id}`}>
          {state === "cleared" ? "REPLAY" : "PLAY"}
          <PlayIcon />
        </ChunkyLink>
      )}
    </>
  );
}
