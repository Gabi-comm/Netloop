"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { playSfx } from "@/lib/sfx";
import styles from "./celebrate.module.css";

export const CLEAR_MS = 2450;
const WIPE_AT_MS = 1450;
const REVEAL_MS = 800;
const COLORS = ["var(--pink)", "var(--points)", "var(--data)", "var(--legit)", "var(--epic-light)"];
const SPARKS = Array.from({ length: 16 }, (_, i) => {
  const angle = (i / 16) * Math.PI * 2 + (i % 2 ? 0.2 : 0);
  const reach = i % 2 ? 120 : 175;
  return { dx: Math.cos(angle) * reach, dy: Math.sin(angle) * reach * 0.8, color: COLORS[i % COLORS.length], delay: (i % 3) * 60 };
});

export function ClearCelebration({ title }: { title: string }) {
  useEffect(() => {
    const t = window.setTimeout(() => playSfx("whoosh"), WIPE_AT_MS);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className={styles.celebrate} role="status" aria-label={title}>
      <div className={styles.burst} aria-hidden="true">
        {SPARKS.map((s, i) => (
          <span
            key={i}
            className={i % 2 ? styles.sparkDot : styles.spark}
            style={{ "--dx": `${s.dx}px`, "--dy": `${s.dy}px`, color: s.color, animationDelay: `${120 + s.delay}ms` } as CSSProperties}
          />
        ))}
      </div>
      <h2 className={`${styles.word} ${title.length > 11 ? styles.wordLong : ""}`} aria-hidden="true">
        {[...title].map((ch, i) => (
          <span key={i} className={styles.letter} style={{ "--i": i, color: COLORS[i % COLORS.length] } as CSSProperties}>
            <span className={styles.wobble} style={{ animationDelay: `${(i % 3) * -0.2}s` }}>
              {ch === " " ? " " : ch}
            </span>
          </span>
        ))}
      </h2>
      <div className={styles.irisClose} style={{ animationDelay: `${WIPE_AT_MS}ms` }} aria-hidden="true" />
    </div>
  );
}

export function IrisReveal() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    playSfx("reveal");
    const t = window.setTimeout(() => setDone(true), REVEAL_MS);
    return () => window.clearTimeout(t);
  }, []);

  if (done) return null;
  return (
    <div className={styles.revealLayer} aria-hidden="true">
      <div className={styles.irisOpen} />
    </div>
  );
}
