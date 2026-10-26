"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowIcon, CodexIcon, GearIcon, PlayIcon, ShopIcon, ZonesIcon } from "@/components/Icons";
import { ChunkyButton, ChunkyLink, DashedRule, DataPill, IconButton, Screen, Sheet, Soon } from "@/components/ui";
import { getStage, Stages } from "@/data/stages";
import { clearedCount, nextStageId, progressStore, useHydrated, useProgress } from "@/lib/progress";
import { HeroScene } from "./HeroScene";
import styles from "./home.module.css";

export function HomeScreen() {
  const progress = useProgress();
  const hydrated = useHydrated();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const stageId = nextStageId(progress);
  const stage = getStage(stageId)!;
  const cleared = clearedCount(progress);
  const allCleared = cleared === Stages.length;
  const hint = !hydrated
    ? " "
    : allCleared
      ? "all zones secured · replay any zone"
      : `${stage.name.toLowerCase()} · zone ${stage.id} of ${Stages.length}`;

  return (
    <Screen fit>
      <div className={styles.top}>
        <DataPill />
        <IconButton label="Settings" onClick={() => setSettingsOpen(true)}>
          <GearIcon />
        </IconButton>
      </div>

      <div className={styles.titleBlock}>
        <h1 className={styles.title}>
          <span className={styles.net}>NET</span>LOOP
        </h1>
        <DashedRule />
        <p className={styles.tagline}>draw a loop. drop the bad packets.</p>
      </div>

      <div className={styles.heroWrap}>
        <HeroScene />
      </div>

      <div className={styles.playWrap}>
        <ChunkyLink href={allCleared ? "/zones" : `/play/${stageId}`} size="big">
          PLAY
          <PlayIcon />
        </ChunkyLink>
      </div>
      <p className={styles.playHint}>{hint}</p>

      <nav className={styles.tiles} aria-label="Main menu">
        <Link href="/zones" className={styles.tile}>
          {hydrated && cleared > 0 && <span className={styles.badge}>{cleared}/{Stages.length}</span>}
          <ZonesIcon />
          Zones
        </Link>
        <Link href="/codex" className={styles.tile}>
          <CodexIcon />
          Codex
        </Link>
        <Link href="/shop" className={styles.tile}>
          <ShopIcon />
          Shop
        </Link>
      </nav>

      <Link href="/endless" className={styles.endless} aria-label="Play endless mode, The Cloud">
        <span className={styles.endlessText}>
          <span className={styles.endlessTitle}>
            ENDLESS <span className={styles.endlessName}>· the cloud</span>
          </span>
          <span className={styles.endlessSub}>
            {hydrated && progress.endless.runs > 0
              ? `best: ${progress.endless.bestWaves} ${progress.endless.bestWaves === 1 ? "wave" : "waves"} · ${progress.endless.bestScore.toLocaleString()} pts`
              : "every threat. how long can you last?"}
          </span>
        </span>
        <span className={styles.endlessButton} aria-hidden="true">
          <ArrowIcon />
        </span>
      </Link>

      <Sheet open={settingsOpen} onClose={() => setSettingsOpen(false)} label="Settings">
        <h2 className={styles.sheetTitle}>SETTINGS</h2>
        <div className={styles.settingsRow}>
          <span>sound</span>
          <Soon />
        </div>
        <div className={styles.settingsRow}>
          <span>haptics</span>
          <Soon />
        </div>
        <ChunkyButton
          tone="ghost"
          size="small"
          onClick={() => {
            progressStore.reset();
            setSettingsOpen(false);
          }}
        >
          reset progress
        </ChunkyButton>
        <ChunkyButton tone="pink" size="small" onClick={() => setSettingsOpen(false)}>
          DONE
        </ChunkyButton>
      </Sheet>
    </Screen>
  );
}
