"use client";

import { DataIcon, StarIcon } from "@/components/Icons";
import { Sprite } from "@/components/Sprite";
import { ChunkyButton, DashedRule } from "@/components/ui";
import { getStage, Stages } from "@/data/stages";
import { PacketKinds, type PacketKindId } from "@/game/kinds";
import type { RunState } from "@/game/runState";
import { BitHappy } from "./BitHappy";
import { BitShutdown } from "./BitShutdown";
import styles from "./play.module.css";

export type StageReward = { stars: number; stageReward: number; packetData: number; starBonus: number; total: number };

export function ZoneClearedView({ run, reward, onContinue, onReplay }: { run: RunState; reward: StageReward; onContinue: () => void; onReplay: () => void }) {
  const next = getStage(run.stage.id + 1);
  return (
    <main className={`${styles.page} ${styles.pageFit}`}>
      <div className={styles.pageHead}>
        <h1 className={styles.pageTitle}>ZONE SECURED!</h1>
        <DashedRule width={260} />
        <p className={styles.pageSub}>{run.stage.name.toLowerCase()} is safe again.</p>
      </div>

      <div className={styles.stars} aria-label={`${reward.stars} of 3 stars`}>
        {[0, 1, 2].map((i) => (
          <span key={i} className={styles.star} style={{ animationDelay: `${250 + i * 220}ms` }}>
            <StarIcon size={58} filled={i < reward.stars} />
          </span>
        ))}
      </div>

      <div className={styles.resultArt}>
        <BitHappy size={120} />
      </div>

      <div className={styles.statRow}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{run.score.toLocaleString()}</span>
          <span className={styles.statLabel}>score</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{run.dropped}</span>
          <span className={styles.statLabel}>threats dropped</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{run.uptime}/{run.maxUptime}</span>
          <span className={styles.statLabel}>uptime left</span>
        </div>
      </div>

      <div className={styles.breakdown}>
        <div className={styles.breakdownRow}><span>zone reward</span><span>+{reward.stageReward}</span></div>
        <div className={styles.breakdownRow}><span>legit packets delivered</span><span>+{reward.packetData}</span></div>
        <div className={styles.breakdownRow}><span>star bonus</span><span>+{reward.starBonus}</span></div>
        <div className={styles.breakdownTotal}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><DataIcon /> data earned</span>
          <span>+{reward.total}</span>
        </div>
      </div>

      <div className={styles.spacer} />

      <div className={styles.buttonStack}>
        <ChunkyButton onClick={onContinue}>{next ? `UNLOCK ZONE ${next.id}` : "BACK TO ZONES"}</ChunkyButton>
        <ChunkyButton tone="ghost" size="small" onClick={onReplay}>replay zone</ChunkyButton>
      </div>
    </main>
  );
}

type Breach = { id: PacketKindId; count: number; final: boolean };

function groupBreaches(ids: PacketKindId[]): Breach[] {
  const last = ids[ids.length - 1];
  const groups = new Map<PacketKindId, Breach>();
  for (const id of ids) {
    const g = groups.get(id);
    if (g) g.count++;
    else groups.set(id, { id, count: 1, final: id === last });
  }
  return [...groups.values()].sort((a, b) => Number(b.final) - Number(a.final) || b.count - a.count);
}

export function NetworkDownView({ run, onRetry, onQuit }: { run: RunState; onRetry: () => void; onQuit: () => void }) {
  const breaches = groupBreaches(run.breaches);
  return (
    <main className={`${styles.page} ${styles.pageFit}`}>
      <div className={styles.pageHead}>
        <h1 className={styles.pageTitle} style={{ color: "var(--threat)" }}>NETWORK DOWN</h1>
        <DashedRule width={260} />
        <p className={styles.pageSub}>
          the threats got through on wave {run.wave} of {run.maxWaves}.
        </p>
      </div>

      <div className={styles.resultArt}>
        <BitShutdown size={breaches.length ? 92 : 120} />
      </div>

      {breaches.length > 0 && (
        <section className={styles.breaches} aria-labelledby="breaches-title">
          <h2 id="breaches-title" className={styles.breachesTitle}>WHAT GOT IN</h2>
          <ul className={styles.breachList}>
            {breaches.map((b, i) => {
              const kind = PacketKinds[b.id];
              return (
                <li key={b.id} className={`${styles.breach} ${b.final ? styles.breachFinal : ""}`} style={{ animationDelay: `${300 + i * 140}ms` }}>
                  <span className={styles.breachArt}>
                    <Sprite anim={kind.walk} size={48} label={kind.label} />
                  </span>
                  <span className={styles.breachText}>
                    <span className={styles.breachName}>
                      {kind.label}
                      {b.final && <span className={styles.breachTag}>final hit</span>}
                    </span>
                  </span>
                  <span className={styles.breachCount} aria-label={`got in ${b.count} ${b.count === 1 ? "time" : "times"}`}>×{b.count}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className={styles.statRow}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{run.score.toLocaleString()}</span>
          <span className={styles.statLabel}>score</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{run.dropped}</span>
          <span className={styles.statLabel}>threats dropped</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{run.stage.id}/{Stages.length}</span>
          <span className={styles.statLabel}>zone</span>
        </div>
      </div>

      {breaches.length === 0 && (
        <p className={styles.pageSub} style={{ fontSize: 19, color: "var(--muted)" }}>
          tip: big loops catch swarms, but never loop a green packet.
        </p>
      )}

      <div className={styles.spacer} />

      <div className={styles.buttonStack}>
        <ChunkyButton onClick={onRetry}>TRY AGAIN</ChunkyButton>
        <ChunkyButton tone="ghost" size="small" onClick={onQuit}>back to zones</ChunkyButton>
      </div>
    </main>
  );
}
