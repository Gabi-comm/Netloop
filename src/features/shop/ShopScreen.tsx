"use client";

import { useEffect, useState } from "react";
import { CheckIcon, DataIcon } from "@/components/Icons";
import { Sprite } from "@/components/Sprite";
import { DataPill, Screen, TopBar } from "@/components/ui";
import { patchItemKey, patchTag, RarityStyle, ShopPatches, type Patch } from "@/game/patches";
import { ownsSkin, skinById, skinItemKey, SkinList, type Skin } from "@/game/skins";
import { progressStore, useHydrated, useProgress } from "@/lib/progress";
import { LinePreview } from "./LinePreview";
import styles from "./shop.module.css";

type TabId = "powerups" | "skins";

const TABS: { id: TabId; label: string }[] = [
  { id: "powerups", label: "POWERUPS" },
  { id: "skins", label: "SKINS" },
];

function Price({ price }: { price: number }) {
  return (
    <>
      <DataIcon size={20} color="var(--ground)" />
      {price}
    </>
  );
}

function BuyButton({ price, balance, onBuy, name }: { price: number; balance: number; onBuy: () => void; name: string }) {
  const short = balance < price;
  return (
    <button type="button" className={`${styles.action} ${styles.buy}`} disabled={short} onClick={onBuy} aria-label={`Buy ${name} for ${price} data`}>
      <Price price={price} />
    </button>
  );
}

function PowerUpCard({ patch, owned, balance, onBuy }: { patch: Patch; owned: boolean; balance: number; onBuy: () => void }) {
  const price = patch.price ?? 0;
  const rarity = RarityStyle[patch.rarity];
  return (
    <li className={`${styles.card} ${owned ? styles.owned : ""}`}>
      <div className={styles.icon}>
        <Sprite anim={patch.icon} size={64} />
      </div>
      <div className={styles.text}>
        <span className={styles.tag} style={{ color: rarity.color }}>{patchTag(patch)}</span>
        <span className={styles.title}>{patch.title}</span>
        <span className={styles.desc}>{patch.description}</span>
        {!owned && balance < price && <span className={styles.need}>need {price - balance} more data</span>}
      </div>
      <div className={styles.side}>
        {owned ? (
          <span className={`${styles.action} ${styles.done}`}>
            <CheckIcon size={18} color="var(--legit)" />
            owned
          </span>
        ) : (
          <BuyButton price={price} balance={balance} onBuy={onBuy} name={patch.title} />
        )}
      </div>
    </li>
  );
}

function SkinCard({
  skin, owned, equipped, balance, onBuy, onEquip,
}: { skin: Skin; owned: boolean; equipped: boolean; balance: number; onBuy: () => void; onEquip: () => void }) {
  return (
    <li className={`${styles.card} ${styles.skinCard} ${equipped ? styles.equipped : ""}`}>
      <div className={styles.skinTop}>
        <div className={styles.icon}>
          <Sprite anim={skin.anims.idle} size={72} />
        </div>
        <div className={styles.text}>
          <span className={styles.tag} style={{ color: skin.accent }}>{skin.price === 0 ? "DEFAULT" : "SKIN"}</span>
          <span className={styles.title}>{skin.title}</span>
          <span className={styles.desc}>{skin.blurb}</span>
        </div>
      </div>
      <div className={styles.skinBottom}>
        <div className={styles.linePreview}>
          <LinePreview style={skin.line} label={`${skin.lineName} preview`} />
          <span className={styles.lineName}>{skin.lineName}</span>
        </div>
        {equipped ? (
          <span className={`${styles.action} ${styles.done}`}>
            <CheckIcon size={18} color="var(--legit)" />
            equipped
          </span>
        ) : owned ? (
          <button type="button" className={`${styles.action} ${styles.equip}`} onClick={onEquip}>
            equip
          </button>
        ) : (
          <BuyButton price={skin.price} balance={balance} onBuy={onBuy} name={skin.title} />
        )}
      </div>
    </li>
  );
}

export function ShopScreen() {
  const [tab, setTab] = useState<TabId>("powerups");
  const [message, setMessage] = useState<string | null>(null);
  const progress = useProgress();
  const hydrated = useHydrated();

  const balance = hydrated ? progress.data : 0;
  const inventory = hydrated ? progress.inventory : [];
  const equipped = skinById(hydrated ? progress.equippedSkin : undefined).id;

  useEffect(() => {
    if (!message) return;
    const id = window.setTimeout(() => setMessage(null), 2400);
    return () => window.clearTimeout(id);
  }, [message]);

  const buyPatch = (patch: Patch) => {
    if (progressStore.buyItem(patchItemKey(patch.id), patch.price ?? 0)) setMessage(`${patch.title} unlocked!`);
  };

  const buySkin = (skin: Skin) => {
    if (progressStore.buyItem(skinItemKey(skin.id), skin.price)) {
      progressStore.equipSkin(skin.id);
      setMessage(`${skin.title} unlocked and equipped!`);
    }
  };

  const unlockedPatches = ShopPatches.filter((p) => inventory.includes(patchItemKey(p.id))).length;
  const ownedSkins = SkinList.filter((s) => ownsSkin(inventory, s.id)).length;

  return (
    <Screen>
      <TopBar title="SHOP" right={<DataPill />} />

      <div className={styles.tabs} role="tablist" aria-label="Shop sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`shop-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`shop-panel-${t.id}`}
            className={`${styles.tab} ${tab === t.id ? styles.tabActive : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className={styles.note}>
        {tab === "powerups"
          ? `new patches for your runs. unlock one and it can show up when you install a patch. ${unlockedPatches} of ${ShopPatches.length} unlocked`
          : `change how Bit looks. his line changes with him. ${ownedSkins} of ${SkinList.length} owned`}
      </p>

      <p className={styles.toast} role="status" aria-live="polite">{message ?? " "}</p>

      <ul className={styles.list} role="tabpanel" id={`shop-panel-${tab}`} aria-labelledby={`shop-tab-${tab}`}>
        {tab === "powerups"
          ? ShopPatches.map((patch) => (
              <PowerUpCard
                key={patch.id}
                patch={patch}
                owned={inventory.includes(patchItemKey(patch.id))}
                balance={balance}
                onBuy={() => buyPatch(patch)}
              />
            ))
          : SkinList.map((skin) => (
              <SkinCard
                key={skin.id}
                skin={skin}
                owned={ownsSkin(inventory, skin.id)}
                equipped={equipped === skin.id}
                balance={balance}
                onBuy={() => buySkin(skin)}
                onEquip={() => progressStore.equipSkin(skin.id)}
              />
            ))}
      </ul>
    </Screen>
  );
}
