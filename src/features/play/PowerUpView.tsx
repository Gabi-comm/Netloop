"use client";

import { useState } from "react";
import { CheckIcon, DataIcon, RerollIcon } from "@/components/Icons";
import { Sprite } from "@/components/Sprite";
import { ChunkyButton, DashedRule, UptimeBars } from "@/components/ui";
import { offerPatches, patchTag, RarityStyle, type Patch } from "@/game/patches";
import { rerollCost, type RunState } from "@/game/runState";
import { progressStore, useHydrated, useProgress } from "@/lib/progress";
import styles from "./play.module.css";

export function PowerUpView({ run, onInstall }: { run: RunState; onInstall: (patch: Patch | null) => void }) {
  const [offers, setOffers] = useState(() => offerPatches(run.patches, run.rng));
  const [picked, setPicked] = useState<number | null>(null);
  const [freeUsed, setFreeUsed] = useState(false);
  const [, setPaid] = useState(run.paidRerolls);
  const progress = useProgress();
  const hydrated = useHydrated();
  const cost = rerollCost(run);
  const balance = hydrated ? progress.data : 0;
  const canAfford = !freeUsed || balance >= cost;

  const reroll = () => {
    if (freeUsed) {
      if (!progressStore.spendData(cost)) return;
      run.paidRerolls++;
      setPaid(run.paidRerolls);
    } else {
      setFreeUsed(true);
    }
    setOffers(offerPatches(run.patches, run.rng));
    setPicked(null);
  };

  return (
    <main className={styles.page}>
      <div className={styles.pageHead}>
        <h1 className={styles.pageTitle}>WAVE CLEAR!</h1>
        <DashedRule width={260} />
        <p className={styles.pageSub}>pick 1 patch. it lasts the whole zone.</p>
      </div>

      <div className={styles.hudRow}>
        <UptimeBars value={run.uptime} max={run.maxUptime} />
        <span className={styles.zoneName} style={{ fontSize: 20 }}>
          score {run.score.toLocaleString()} · next: wave {run.wave + 1}
        </span>
      </div>

      {offers.length === 0 ? (
        <p className={styles.pageSub}>you already own every patch!</p>
      ) : (
        <div className={styles.cards} key={offers.map((o) => o.id).join()}>
          {offers.map((patch, i) => {
            const selected = picked === i;
            return (
              <button
                key={patch.id}
                type="button"
                aria-pressed={selected}
                className={`${styles.card} ${selected ? styles.cardSelected : ""}`}
                onClick={() => setPicked(i)}
              >
                <div className={styles.cardIcon}>
                  <Sprite anim={patch.icon} size={64} />
                </div>
                <div className={styles.cardText}>
                  <span className={styles.cardTag} style={{ color: RarityStyle[patch.rarity].color }}>
                    {patchTag(patch)}
                  </span>
                  <span className={styles.cardTitle}>{patch.title}</span>
                  <span className={styles.cardDesc}>{patch.description}</span>
                </div>
                {selected && (
                  <div className={styles.check}>
                    <CheckIcon />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className={styles.spacer} />

      <ChunkyButton
        disabled={offers.length > 0 && picked === null}
        onClick={() => onInstall(picked === null ? null : offers[picked])}
      >
        {offers.length === 0 ? "CONTINUE" : "INSTALL PATCH"}
      </ChunkyButton>
      <div className={styles.reroll}>
        <button
          type="button"
          className={styles.textButton}
          onClick={reroll}
          disabled={!canAfford || offers.length === 0}
          aria-label={freeUsed ? `Reroll for ${cost} data` : "Free reroll"}
        >
          <RerollIcon />
          {freeUsed ? (
            <>
              reroll ·
              <span className={styles.rerollCost}>
                <DataIcon size={16} />
                {cost}
              </span>
            </>
          ) : (
            "free reroll"
          )}
        </button>
        {freeUsed && (
          <span className={`${styles.rerollNote} ${canAfford ? "" : styles.rerollNoteShort}`}>
            {canAfford ? `you have ${balance} data · price doubles each reroll` : `need ${cost} data · you have ${balance}`}
          </span>
        )}
      </div>
    </main>
  );
}
