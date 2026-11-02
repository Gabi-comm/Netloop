"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { CloudIcon, CodexIcon, GearIcon, PlayIcon, ShopIcon, ZonesIcon } from "@/components/Icons";
import { Sprite } from "@/components/Sprite";
import { ChunkyButton, DataPill, IconButton, Screen, Sheet, Toggle } from "@/components/ui";
import { getStage, Stages } from "@/data/stages";
import { skinById } from "@/game/skins";
import { savedEndlessWave } from "@/lib/endlessSave";
import { clearedCount, nextStageId, progressStore, useHydrated, useProgress } from "@/lib/progress";
import { setMusicEnabled, setMusicVolume, useMusicEnabled, useMusicVolume } from "@/lib/music";
import { playSfx, setSoundEnabled, setSoundVolume, useSoundEnabled, useSoundVolume } from "@/lib/sfx";
import { HeroScene } from "./HeroScene";
import { Intro } from "./Intro";
import styles from "./home.module.css";

function Hex({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span className={styles.hex} style={{ color }}>
      <svg aria-hidden="true" viewBox="0 0 48 52" className={styles.hexShape}>
        <path d="M24 3 L44 14 Q45 15 45 17 L45 36 Q45 38 44 39 L24 50 L4 39 Q3 38 3 36 L3 17 Q3 15 4 14 Z" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
      </svg>
      {children}
    </span>
  );
}

function HomeBackdrop() {
  return (
    <svg aria-hidden="true" className={styles.backdrop} viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
      <g fill="none" stroke="#262624" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M0 210 L36 210 L52 226 L52 330 M0 260 L18 260 L28 270 L28 420" />
        <path d="M390 240 L352 240 L338 254 L338 360 M390 300 L366 300 L360 306 L360 470" />
        <path d="M0 640 L30 640 L44 626 L44 560 M390 680 L356 680 L344 668 L344 600" />
      </g>
      <g fill="#2c2c2a">
        <circle cx="52" cy="330" r="4" />
        <circle cx="28" cy="420" r="4" />
        <circle cx="338" cy="360" r="4" />
        <circle cx="360" cy="470" r="4" />
        <circle cx="44" cy="560" r="4" />
        <circle cx="344" cy="600" r="4" />
      </g>
      <g fill="none" stroke="#333330" strokeWidth="2.5" strokeLinecap="round">
        <path d="M318 96 L321 86 M325 96 L325 85 M331 96 L329 87" />
        <path d="M24 92 L27 82 M31 92 L31 81 M37 92 L35 83" />
      </g>
    </svg>
  );
}

function VolumeRow({
  value, enabled, label, onChange, onRelease,
}: { value: number; enabled: boolean; label: string; onChange: (v: number) => void; onRelease?: () => void }) {
  const percent = Math.round(value * 100);
  return (
    <div className={`${styles.settingsRow} ${enabled ? "" : styles.settingsRowOff}`}>
      <span className={styles.settingsSub}>volume</span>
      <div className={styles.volume}>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={percent}
          disabled={!enabled}
          aria-label={label}
          className={styles.volumeSlider}
          style={{ "--fill": `${percent}%` } as CSSProperties}
          onChange={(e) => onChange(Number(e.target.value) / 100)}
          onPointerUp={onRelease}
          onKeyUp={onRelease}
        />
        <span className={styles.volumeValue}>{percent}%</span>
      </div>
    </div>
  );
}

export function HomeScreen() {
  const progress = useProgress();
  const hydrated = useHydrated();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [endlessWave, setEndlessWave] = useState<number | null>(null);
  const sound = useSoundEnabled();
  const volume = useSoundVolume();
  const musicOn = useMusicEnabled();
  const musicLevel = useMusicVolume();
  const skin = skinById(hydrated ? progress.equippedSkin : undefined);

  useEffect(() => setEndlessWave(savedEndlessWave()), []);

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
    <Screen fit doodles={false}>
      <HomeBackdrop />
      <Intro />
      <div className={styles.top}>
        <DataPill />
        <IconButton label="Settings" sound="settings" onClick={() => setSettingsOpen(true)}>
          <GearIcon />
        </IconButton>
      </div>

      <div className={styles.banner}>
        <h1 className={styles.title}>
          <span className={styles.net}>NET</span>LOOP
        </h1>
        <div className={styles.bannerBit}>
          <Sprite anim={skin.anims.idle} size={64} />
        </div>
      </div>

      <div className={styles.heroWrap}>
        <HeroScene lineColor={skin.line.color} />
      </div>

      <Link href={allCleared ? "/zones" : `/play/${stageId}`} className={styles.play} aria-label={`Play, ${hint}`} onClick={() => playSfx("play")}>
        <span className={styles.playButton} aria-hidden="true">
          <PlayIcon size={34} />
        </span>
        <span className={styles.playLabel}>PLAY</span>
      </Link>

      <nav className={styles.tiles} aria-label="Main menu">
        <Link href="/zones" className={styles.tile} onClick={() => playSfx("zones")}>
          <Hex color="var(--data)">
            <ZonesIcon size={26} />
          </Hex>
          <span className={styles.tileTitle}>ZONES</span>
        </Link>
        <Link href="/codex" className={styles.tile} onClick={() => playSfx("codex")}>
          <Hex color="var(--points)">
            <CodexIcon size={26} />
          </Hex>
          <span className={styles.tileTitle}>CODEX</span>
        </Link>
        <Link href="/shop" className={styles.tile} onClick={() => playSfx("shop")}>
          <Hex color="var(--pink)">
            <ShopIcon size={26} />
          </Hex>
          <span className={styles.tileTitle}>SHOP</span>
        </Link>
        <Link
          href="/endless"
          className={styles.tile}
          aria-label={endlessWave ? `Endless mode, continue from wave ${endlessWave}` : "Endless mode, The Cloud"}
          onClick={() => playSfx("zone", 8)}
        >
          <Hex color="var(--epic-light)">
            <CloudIcon size={26} color="var(--epic-light)" />
          </Hex>
          <span className={styles.tileText}>
            <span className={styles.tileTitle}>ENDLESS</span>
            {endlessWave ? (
              <span className={styles.tileBest}>continue · wave {endlessWave}</span>
            ) : hydrated && progress.endless.bestScore > 0 && (
              <span className={styles.tileBest}>best {progress.endless.bestScore.toLocaleString()}</span>
            )}
          </span>
        </Link>
      </nav>

      {!allCleared && (
        <p className={styles.ticker}>
          <span className={styles.tickerDot} aria-hidden="true" />
          <span className={styles.tickerLabel}>NEXT UP</span>
          <span className={styles.tickerText}>{hint}</span>
        </p>
      )}

      <Sheet open={settingsOpen} onClose={() => setSettingsOpen(false)} label="Settings">
        <h2 className={styles.sheetTitle}>SETTINGS</h2>
        <div className={styles.settingsRow}>
          <span>sound effects</span>
          <Toggle on={sound} onChange={setSoundEnabled} label="Sound effects" />
        </div>
        <VolumeRow value={volume} enabled={sound} label="Sound effects volume" onChange={setSoundVolume} onRelease={() => playSfx("pick", 1)} />
        <div className={styles.settingsRow}>
          <span>music</span>
          <Toggle on={musicOn} onChange={setMusicEnabled} label="Background music" />
        </div>
        <VolumeRow value={musicLevel} enabled={musicOn} label="Music volume" onChange={setMusicVolume} />
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
