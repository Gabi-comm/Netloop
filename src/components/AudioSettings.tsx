"use client";

import type { CSSProperties } from "react";
import { setMusicEnabled, setMusicVolume, useMusicEnabled, useMusicVolume } from "@/lib/music";
import { playSfx, setSoundEnabled, setSoundVolume, useSoundEnabled, useSoundVolume } from "@/lib/sfx";
import { Toggle } from "./ui";
import styles from "./audioSettings.module.css";

export const settingsStyles = styles;

function VolumeRow({
  value, enabled, label, onChange, onRelease,
}: { value: number; enabled: boolean; label: string; onChange: (v: number) => void; onRelease?: () => void }) {
  const percent = Math.round(value * 100);
  return (
    <div className={`${styles.row} ${enabled ? "" : styles.rowOff}`}>
      <span className={styles.sub}>volume</span>
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

export function AudioSettings() {
  const sound = useSoundEnabled();
  const volume = useSoundVolume();
  const musicOn = useMusicEnabled();
  const musicLevel = useMusicVolume();

  return (
    <>
      <div className={styles.row}>
        <span>sound effects</span>
        <Toggle on={sound} onChange={setSoundEnabled} label="Sound effects" />
      </div>
      <VolumeRow value={volume} enabled={sound} label="Sound effects volume" onChange={setSoundVolume} onRelease={() => playSfx("pick", 1)} />
      <div className={styles.row}>
        <span>music</span>
        <Toggle on={musicOn} onChange={setMusicEnabled} label="Background music" />
      </div>
      <VolumeRow value={musicLevel} enabled={musicOn} label="Music volume" onChange={setMusicVolume} />
    </>
  );
}
