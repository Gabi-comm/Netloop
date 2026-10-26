"use client";

import { useEffect, useState } from "react";
import { ChunkyButton } from "@/components/ui";
import { Patches } from "@/game/patches";
import { spriteUrl } from "@/game/sprites";
import briefing from "./briefing.module.css";
import styles from "./patchIntro.module.css";

export const PATCH_INTRO_TIP = "tip:patches";

const ARM_DELAY_MS = 600;
const DEMO = [Patches.rateLimiter, Patches.autoPatch, Patches.honeypot];

const STEPS = [
  { title: "pick 1 after every wave", text: "three patches are offered. tap one, then INSTALL PATCH." },
  { title: "it lasts the whole zone", text: "patches stack up until the zone ends, then reset." },
  { title: "ACTIVE ones get a button", text: "tap it during the fight. long-press any patch icon to see what it does." },
];

export function PatchIntro({ onDismiss }: { onDismiss: () => void }) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setArmed(true), ARM_DELAY_MS);
    return () => window.clearTimeout(t);
  }, []);

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

  return (
    <div className={briefing.backdrop}>
      <section className={briefing.card} role="dialog" aria-modal="true" aria-labelledby="patch-intro-title">
        <span className={`${briefing.tag} ${styles.tag}`}>NEW: PATCHES!</span>

        <div className={briefing.demo}>
          <svg className={styles.scene} viewBox="0 0 300 140" role="img" aria-label="Animation: three patch cards appear, one is tapped and installed into your patch bar">
            <g className={styles.bar}>
              <rect x="10" y="10" width="92" height="30" rx="9" className={styles.barBox} />
              <text x="20" y="30" className={styles.barLabel}>patches</text>
              <rect x="70" y="14" width="22" height="22" rx="6" className={styles.slot} />
            </g>
            {DEMO.map((patch, i) => (
              <g key={patch.id} className={`${styles.card} ${styles[`card${i}`]}`}>
                <rect x={40 + i * 80} y="52" width="62" height="76" rx="10" className={styles.cardBox} />
                <image href={spriteUrl(patch.icon.name)} x={53 + i * 80} y="62" width="36" height="36" />
                <rect x={50 + i * 80} y="106" width="42" height="5" rx="2.5" className={styles.cardLine} />
                <rect x={56 + i * 80} y="115" width="30" height="5" rx="2.5" className={styles.cardLine} />
              </g>
            ))}
            <g className={styles.check}>
              <circle cx="176" cy="54" r="9" className={styles.checkDot} />
              <path d="M171.5 54 L175 57.5 L181 50.5" className={styles.checkMark} />
            </g>
            <g className={styles.fly}>
              <image href={spriteUrl(DEMO[1].icon.name)} x="72" y="16" width="18" height="18" />
            </g>
            <g className={styles.finger}>
              <circle cx="0" cy="0" r="9" className={styles.fingerDot} />
              <circle cx="0" cy="0" r="15" className={styles.fingerRing} />
            </g>
          </svg>
        </div>

        <ol className={styles.steps}>
          {STEPS.map((step, i) => (
            <li key={step.title} className={styles.step} style={{ animationDelay: `${300 + i * 160}ms` }}>
              <span className={styles.num}>{i + 1}</span>
              <span className={styles.stepText}>
                <span className={styles.stepTitle}>{step.title}</span>
                <span className={styles.stepBody}>{step.text}</span>
              </span>
            </li>
          ))}
        </ol>

        <ChunkyButton size="small" onClick={onDismiss} disabled={!armed}>
          GOT IT
        </ChunkyButton>
      </section>
    </div>
  );
}
