"use client";

import { useState } from "react";
import { Sprite } from "@/components/Sprite";
import { DataPill, Screen, TopBar } from "@/components/ui";
import { CodexKinds, type PacketKind } from "@/game/kinds";
import { Patches, patchSeenKey, patchTag, RarityStyle, type Patch } from "@/game/patches";
import { useHydrated, useProgress } from "@/lib/progress";
import styles from "./codex.module.css";

type TabId = "enemies" | "upgrades";

const TABS: { id: TabId; label: string }[] = [
  { id: "enemies", label: "ENEMIES" },
  { id: "upgrades", label: "UPGRADES" },
];

const PatchList: Patch[] = Object.values(Patches).sort((a, b) => RarityStyle[a.rarity].order - RarityStyle[b.rarity].order);

type EntryProps = {
  found: boolean;
  icon: React.ReactNode;
  tag: string;
  tagColor?: string;
  title: string;
  description: string;
};

function Entry({ found, icon, tag, tagColor, title, description }: EntryProps) {
  return (
    <li className={`${styles.entry} ${found ? "" : styles.locked}`} aria-label={found ? title : "Undiscovered entry"}>
      <div className={styles.icon}>{icon}</div>
      <div className={styles.text}>
        {found ? (
          <>
            <span className={styles.tag} style={{ color: tagColor }}>{tag}</span>
            <span className={styles.title}>{title}</span>
            <span className={styles.desc}>{description}</span>
          </>
        ) : (
          <>
            <span className={`${styles.redact} ${styles.redactTag}`} aria-hidden="true" />
            <span className={`${styles.redact} ${styles.redactTitle}`} aria-hidden="true" />
            <span className={styles.desc}>N/A</span>
          </>
        )}
      </div>
    </li>
  );
}

function EnemyEntry({ kind, found }: { kind: PacketKind; found: boolean }) {
  return (
    <Entry
      found={found}
      icon={<Sprite anim={kind.walk} size={64} playing={found} className={found ? undefined : styles.silhouette} />}
      tag={kind.isThreat ? "THREAT" : "FRIENDLY"}
      tagColor={kind.isThreat ? "var(--threat)" : "var(--legit)"}
      title={kind.label}
      description={`${kind.caption}. ${kind.howTo}`}
    />
  );
}

function PatchEntry({ patch, found }: { patch: Patch; found: boolean }) {
  return (
    <Entry
      found={found}
      icon={<Sprite anim={patch.icon} size={64} className={found ? undefined : styles.silhouette} />}
      tag={patchTag(patch)}
      tagColor={RarityStyle[patch.rarity].color}
      title={patch.title}
      description={patch.description}
    />
  );
}

export function CodexScreen() {
  const [tab, setTab] = useState<TabId>("enemies");
  const progress = useProgress();
  const hydrated = useHydrated();

  const seen = (key: string) => hydrated && progress.seen.includes(key);
  const enemiesFound = CodexKinds.filter((k) => seen(k.id)).length;
  const patchesFound = PatchList.filter((p) => seen(patchSeenKey(p.id))).length;
  const found = tab === "enemies" ? enemiesFound : patchesFound;
  const total = tab === "enemies" ? CodexKinds.length : PatchList.length;

  return (
    <Screen>
      <TopBar title="CODEX" right={<DataPill />} />

      <div className={styles.tabs} role="tablist" aria-label="Codex sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`codex-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`codex-panel-${t.id}`}
            className={`${styles.tab} ${tab === t.id ? styles.tabActive : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className={styles.count}>
        {found} of {total} discovered
      </p>

      <ul className={styles.list} role="tabpanel" id={`codex-panel-${tab}`} aria-labelledby={`codex-tab-${tab}`}>
        {tab === "enemies"
          ? CodexKinds.map((kind) => <EnemyEntry key={kind.id} kind={kind} found={seen(kind.id)} />)
          : PatchList.map((patch) => <PatchEntry key={patch.id} patch={patch} found={seen(patchSeenKey(patch.id))} />)}
      </ul>
    </Screen>
  );
}
