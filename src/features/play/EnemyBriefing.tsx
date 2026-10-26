"use client";

import { useEffect, useState } from "react";
import { Sprite } from "@/components/Sprite";
import { ChunkyButton } from "@/components/ui";
import { PacketKinds, type PacketKindId } from "@/game/kinds";
import { BehaviorDemo } from "./BehaviorDemo";
import styles from "./briefing.module.css";

const ARM_DELAY_MS = 600;

function speedLabel(speed: number) {
  if (speed < 0.06) return "slow";
  if (speed < 0.09) return "normal";
  return "fast";
}

export function EnemyBriefing({ kindId, onDismiss }: { kindId: PacketKindId; onDismiss: () => void }) {
  const kind = PacketKinds[kindId];
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    setArmed(false);
    const t = window.setTimeout(() => setArmed(true), ARM_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [kindId]);

  useEffect(() => {
    if (!armed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
        e.preventDefault();
        onDismiss();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [armed, onDismiss]);

  const friendly = !kind.isThreat;

  return (
    <div className={styles.backdrop}>
      <section key={kindId} className={styles.card} role="dialog" aria-modal="true" aria-labelledby="briefing-name">
        <span className={`${styles.tag} ${friendly ? styles.tagFriendly : ""}`}>{friendly ? "FRIENDLY PACKET" : "NEW THREAT!"}</span>

        <div className={styles.demo}>
          <BehaviorDemo kind={kindId} label={`Animation: ${kind.howTo}`} />
        </div>

        <div className={styles.head}>
          <div className={styles.portrait}>
            <Sprite anim={kind.walk} size={58} />
          </div>
          <div className={styles.names}>
            <h2 id="briefing-name" className={styles.name}>{kind.label}</h2>
            <span className={styles.caption}>{kind.caption}</span>
          </div>
        </div>

        <p className={styles.howTo}>{kind.howTo}</p>

        <dl className={styles.stats}>
          <div className={styles.stat}>
            <dt>{friendly ? "loop it?" : "loops"}</dt>
            <dd>{friendly ? <span style={{ color: "var(--threat)" }}>never</span> : <span className={styles.pips}>{Array.from({ length: kind.hp }, (_, i) => <i key={i} />)}</span>}</dd>
          </div>
          <div className={styles.stat}>
            <dt>speed</dt>
            <dd>{speedLabel(kind.speed)}</dd>
          </div>
          <div className={styles.stat}>
            <dt>{friendly ? "delivered" : "drop it"}</dt>
            <dd>+{kind.points}</dd>
          </div>
        </dl>

        <ChunkyButton size="small" onClick={onDismiss} disabled={!armed}>
          GOT IT
        </ChunkyButton>
      </section>
    </div>
  );
}
