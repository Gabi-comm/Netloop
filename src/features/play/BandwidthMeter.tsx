"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Skin } from "@/game/skins";
import styles from "./play.module.css";

const LOW = 0.25;

export function BandwidthMeter({ value, drawing, skin }: { value: number; drawing: boolean; skin?: Skin }) {
  const full = value >= 0.999;
  const low = value < LOW;
  const recharging = !drawing && !full;
  const wasFull = useRef(full);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (full && !wasFull.current) {
      setFlash(true);
      const t = window.setTimeout(() => setFlash(false), 600);
      wasFull.current = full;
      return () => window.clearTimeout(t);
    }
    wasFull.current = full;
  }, [full]);

  const state = drawing ? "drawing" : full ? "full" : "recharging…";

  return (
    <div
      className={styles.bandwidth}
      data-line={skin?.line.kind}
      style={skin ? ({ "--bw": skin.accent, "--bw-edge": skin.line.edge } as CSSProperties) : undefined}
      role="meter"
      aria-label="bandwidth"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      aria-valuetext={`${Math.round(value * 100)}%, ${state}`}
    >
      <span className={styles.bandwidthLabel}>bandwidth</span>
      <div className={`${styles.bandwidthTrack} ${flash ? styles.bandwidthFlash : ""}`}>
        <div
          className={`${styles.bandwidthFill} ${low ? styles.bandwidthLow : ""} ${recharging ? styles.bandwidthCharging : ""}`}
          style={{ transform: `scaleX(${Math.max(0, Math.min(1, value))})` }}
        />
      </div>
      <span className={`${styles.bandwidthState} ${recharging ? styles.bandwidthStateCharging : ""} ${low && !drawing ? styles.bandwidthStateLow : ""}`}>
        {state}
      </span>
    </div>
  );
}
