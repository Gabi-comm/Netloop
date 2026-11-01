"use client";

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
  const unlockedByCelebration = celebrate !== null && celebrate < Stages.length ? celebrate + 1 : null;
  const litUntil = Stages.reduce((n, stage, i) => (i > 0 && isStageUnlocked(progress, stage.id) ? i : n), 0);

  return (
    <Screen>
      <TopBar title="ZONES" right={<DataPill />} />

      <div className={styles.summary}>
        <span>{hydrated ? `${cleared} of ${Stages.length} zones secured` : " "}</span>
        <div className={styles.meter} aria-hidden="true">
          <div className={styles.meterFill} style={{ transform: `scaleX(${cleared / Stages.length})` }} />
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
                    <span className={styles.labelName}>{stage.name}</span>
                    <span className={styles.labelPlace}>{stage.place}</span>
                    {state === "cleared" && record ? <Stars count={record.stars} /> : isCurrent ? <span className={styles.nextTag}>next up</span> : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

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
