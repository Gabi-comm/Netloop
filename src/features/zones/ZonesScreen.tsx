"use client";

import { useEffect, useState } from "react";
import { LockIcon, PlayIcon, StarIcon } from "@/components/Icons";
import { Sprite } from "@/components/Sprite";
import { ChunkyLink, DataPill, Screen, Sheet, TopBar } from "@/components/ui";
import { Stages, stageThreats, WAVES_PER_STAGE, type Stage } from "@/data/stages";
import { PacketKinds } from "@/game/kinds";
import { clearedCount, isStageUnlocked, nextStageId, progressStore, useHydrated, useProgress, type Progress } from "@/lib/progress";
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

function Connector({ fromLeft, lit, animate }: { fromLeft: boolean; lit: boolean; animate: boolean }) {
  const d = fromLeft ? "M45 0 C45 40 255 30 255 70" : "M255 0 C255 40 45 30 45 70";
  return (
    <svg aria-hidden="true" className={styles.connector} viewBox="0 0 300 70" preserveAspectRatio="none">
      <path d={d} fill="none" stroke="var(--line)" strokeWidth="4" strokeLinecap="round" strokeDasharray="10 10" vectorEffect="non-scaling-stroke" />
      {lit && (
        <path
          d={d}
          pathLength={100}
          className={animate ? styles.connectorDraw : undefined}
          fill="none"
          stroke="var(--chalk)"
          strokeWidth="4"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}

export function ZonesScreen() {
  const progress = useProgress();
  const hydrated = useHydrated();
  const [selected, setSelected] = useState<Stage | null>(null);
  const [celebrate, setCelebrate] = useState<number | null>(null);

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
  const unlockedByCelebration = celebrate !== null && celebrate < Stages.length ? celebrate + 1 : null;

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

      <ol className={styles.map}>
        {Stages.map((stage, index) => {
          const state = hydrated ? nodeState(progress, stage) : stage.id === 1 ? "open" : "locked";
          const record = progress.stages[stage.id];
          const left = index % 2 === 0;
          const isCurrent = hydrated && state === "open" && stage.id === current;
          const popping = celebrate === stage.id || unlockedByCelebration === stage.id;
          const next = Stages[index + 1];
          const nextLit = hydrated && next ? isStageUnlocked(progress, next.id) : false;
          return (
            <li key={stage.id} className={styles.row}>
              <div className={`${styles.stop} ${left ? styles.left : styles.right}`}>
                <button
                  type="button"
                  className={`${styles.node} ${styles[state]} ${isCurrent ? styles.current : ""} ${popping ? styles.pop : ""}`}
                  onClick={() => setSelected(stage)}
                  aria-label={`Zone ${stage.id}, ${stage.name}, ${state === "locked" ? "locked" : state === "cleared" ? "cleared" : "ready"}`}
                >
                  {state === "locked" ? <LockIcon size={28} /> : <span className={styles.nodeNumber}>{stage.id}</span>}
                </button>
                <div className={styles.label}>
                  <span className={styles.labelName}>{stage.name}</span>
                  <span className={styles.labelPlace}>{stage.place}</span>
                  {state === "cleared" && record ? <Stars count={record.stars} /> : isCurrent ? <span className={styles.nextTag}>next up</span> : null}
                </div>
              </div>
              {next && <Connector fromLeft={left} lit={nextLit} animate={unlockedByCelebration === next.id} />}
            </li>
          );
        })}
      </ol>

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
