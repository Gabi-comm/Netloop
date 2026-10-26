"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Sprite } from "@/components/Sprite";
import { Patches, patchTag, RarityStyle, type PatchId } from "@/game/patches";
import styles from "./play.module.css";

const HOLD_MS = 350;

export function PatchStrip({ patches }: { patches: PatchId[] }) {
  const [open, setOpen] = useState<PatchId | null>(null);
  const timer = useRef<number | null>(null);

  const clearTimer = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  };

  useEffect(() => clearTimer, []);

  const onUp = () => {
    clearTimer();
    setOpen(null);
  };

  const onDown = (id: PatchId) => (e: ReactPointerEvent<HTMLButtonElement>) => {
    clearTimer();
    if (e.pointerType === "mouse") {
      setOpen(id);
      return;
    }
    window.addEventListener("pointerup", onUp, { once: true });
    window.addEventListener("pointercancel", onUp, { once: true });
    timer.current = window.setTimeout(() => setOpen(id), HOLD_MS);
  };

  if (patches.length === 0) return null;
  const shown = open ? Patches[open] : null;

  return (
    <div className={styles.patchWrap}>
      <ul className={styles.patchStrip} aria-label="Installed patches. Long press one to see what it does.">
        {patches.map((id) => {
          const patch = Patches[id];
          return (
            <li key={id}>
              <button
                type="button"
                className={`${styles.patchIcon} ${open === id ? styles.patchIconOpen : ""}`}
                style={{ borderColor: RarityStyle[patch.rarity].color }}
                aria-label={`${patch.title}: ${patch.description}`}
                aria-expanded={open === id}
                onPointerDown={onDown(id)}
                onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(id)}
                onPointerLeave={(e) => e.pointerType === "mouse" && onUp()}
                onFocus={(e) => e.currentTarget.matches(":focus-visible") && setOpen(id)}
                onBlur={onUp}
                onContextMenu={(e) => e.preventDefault()}
              >
                <Sprite anim={patch.icon} size={26} />
              </button>
            </li>
          );
        })}
      </ul>

      {shown && (
        <div className={styles.patchTip} role="tooltip">
          <span className={styles.patchTipTag} style={{ color: RarityStyle[shown.rarity].color }}>{patchTag(shown)}</span>
          <span className={styles.patchTipTitle}>{shown.title}</span>
          <span className={styles.patchTipDesc}>{shown.description}</span>
        </div>
      )}
    </div>
  );
}
