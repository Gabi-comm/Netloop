"use client";

import { useEffect, useState } from "react";
import { CheckIcon, DataIcon } from "@/components/Icons";
import { Sprite } from "@/components/Sprite";
import { DataPill, Screen, TopBar } from "@/components/ui";
import { ItemList, MAX_ITEM_STOCK, type Item } from "@/game/items";
import { describePatch, MAX_PATCH_LEVEL, patchItemKey, patchStat, patchTag, patchUnlocked, RarityStyle, ShopPatches, upgradeCost, type Patch } from "@/game/patches";
import { ownsSkin, skinById, skinItemKey, SkinList, type Skin } from "@/game/skins";
import { progressStore, useHydrated, useProgress } from "@/lib/progress";
import { playSfx } from "@/lib/sfx";
import { LinePreview } from "./LinePreview";
import styles from "./shop.module.css";

type TabId = "patches" | "items" | "skins";

const TABS: { id: TabId; label: string }[] = [
  { id: "patches", label: "PATCHES" },
  { id: "items", label: "POWERUPS" },
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

function LevelPips({ level }: { level: number }) {
  return (
    <span className={styles.pips} aria-hidden="true">
      {Array.from({ length: MAX_PATCH_LEVEL }, (_, i) => (
        <span key={i} className={`${styles.pip} ${i < level ? styles.pipOn : ""}`} />
      ))}
    </span>
  );
}

function UpgradeButton({ price, balance, onUpgrade, name, next }: { price: number; balance: number; onUpgrade: () => void; name: string; next: number }) {
  return (
    <button
      type="button"
      className={`${styles.action} ${styles.buy} ${styles.upgrade}`}
      disabled={balance < price}
      onClick={onUpgrade}
      aria-label={`Upgrade ${name} to level ${next} for ${price} data`}
    >
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16">
        <path d="M3 11 L8 5 L13 11" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <Price price={price} />
    </button>
  );
}

function PowerUpCard({
  patch, owned, level, balance, onBuy, onUpgrade,
}: { patch: Patch; owned: boolean; level: number; balance: number; onBuy: () => void; onUpgrade: () => void }) {
  const rarity = RarityStyle[patch.rarity];
  const maxed = owned && level >= MAX_PATCH_LEVEL;
  const cost = owned ? upgradeCost(patch, level) : patch.price ?? 0;
  return (
    <li className={`${styles.card} ${styles.skinCard} ${owned ? styles.owned : ""} ${maxed ? styles.maxed : ""}`}>
      <div className={styles.skinTop}>
        <div className={styles.icon}>
          <Sprite anim={patch.icon} size={64} />
        </div>
        <div className={styles.text}>
          <span className={styles.tag} style={{ color: rarity.color }}>{patchTag(patch)}</span>
          <span className={styles.title}>{patch.title}</span>
          <span className={styles.desc}>{describePatch(patch.id, level)}</span>
          {owned && !maxed && <span className={styles.next}>LV {level + 1}: {patchStat(patch.id, level + 1)}</span>}
          {!maxed && balance < cost && <span className={styles.need}>need {cost - balance} more data</span>}
        </div>
      </div>
      <div className={styles.skinBottom}>
        <span className={styles.levelRow}>
          {owned ? (
            <>
              <LevelPips level={level} />
              <span className={styles.levelLabel}>{maxed ? "MAX LEVEL" : `LV ${level} / ${MAX_PATCH_LEVEL}`}</span>
            </>
          ) : (
            <span className={styles.lockedNote}>unlock to upgrade</span>
          )}
        </span>
        {maxed ? (
          <span className={`${styles.action} ${styles.done}`}>
            <CheckIcon size={18} color="var(--legit)" />
            maxed
          </span>
        ) : owned ? (
          <UpgradeButton price={cost} balance={balance} onUpgrade={onUpgrade} name={patch.title} next={level + 1} />
        ) : (
          <BuyButton price={cost} balance={balance} onBuy={onBuy} name={patch.title} />
        )}
      </div>
    </li>
  );
}

function ItemCard({ item, stock, balance, onBuy }: { item: Item; stock: number; balance: number; onBuy: () => void }) {
  const rarity = RarityStyle[item.rarity];
  const full = stock >= MAX_ITEM_STOCK;
  return (
    <li className={`${styles.card} ${styles.skinCard} ${stock > 0 ? styles.owned : ""}`}>
      <div className={styles.skinTop}>
        <div className={styles.icon}>
          <Sprite anim={item.icon} size={64} />
        </div>
        <div className={styles.text}>
          <span className={styles.tag} style={{ color: rarity.color }}>{rarity.label} · 1 USE</span>
          <span className={styles.title}>{item.title}</span>
          <span className={styles.desc}>{item.description}</span>
          {!full && balance < item.price && <span className={styles.need}>need {item.price - balance} more data</span>}
        </div>
      </div>
      <div className={styles.skinBottom}>
        <span className={styles.levelRow}>
          <span className={styles.levelLabel}>in your bag: {stock} / {MAX_ITEM_STOCK}</span>
        </span>
        {full ? (
          <span className={`${styles.action} ${styles.done}`}>
            <CheckIcon size={18} color="var(--legit)" />
            full
          </span>
        ) : (
          <BuyButton price={item.price} balance={balance} onBuy={onBuy} name={item.title} />
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
  const [tab, setTab] = useState<TabId>("patches");
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
    if (progressStore.buyItem(patchItemKey(patch.id), patch.price ?? 0)) {
      playSfx("buy");
      setMessage(`${patch.title} unlocked!`);
    }
  };

  const buyItemStock = (item: Item, stock: number) => {
    if (progressStore.buyConsumable(item.id, item.price, MAX_ITEM_STOCK)) {
      playSfx("buy");
      setMessage(`${item.title} added! you have ${stock + 1}`);
    }
  };

  const upgradePatch = (patch: Patch, level: number) => {
    if (progressStore.upgradePatch(patch.id, upgradeCost(patch, level), MAX_PATCH_LEVEL)) {
      playSfx("upgrade", level + 1);
      setMessage(level + 1 >= MAX_PATCH_LEVEL ? `${patch.title} maxed out!` : `${patch.title} upgraded to level ${level + 1}!`);
    }
  };

  const glitchIn = (skin: Skin, delayMs: number) => {
    if (!skin.teleport) return;
    playSfx("glitch", 0, delayMs);
    playSfx("glitch", 1, delayMs + 600);
  };

  const buySkin = (skin: Skin) => {
    if (progressStore.buyItem(skinItemKey(skin.id), skin.price)) {
      progressStore.equipSkin(skin.id);
      playSfx("buy");
      glitchIn(skin, 450);
      setMessage(`${skin.title} unlocked and equipped!`);
    }
  };

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
            onClick={() => {
              if (tab !== t.id) playSfx("tap");
              setTab(t.id);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className={styles.toast} role="status" aria-live="polite">{message ?? " "}</p>

      <ul className={styles.list} role="tabpanel" id={`shop-panel-${tab}`} aria-labelledby={`shop-tab-${tab}`}>
        {tab === "items"
          ? ItemList.map((item) => {
              const stock = hydrated ? progress.consumables[item.id] ?? 0 : 0;
              return <ItemCard key={item.id} item={item} stock={stock} balance={balance} onBuy={() => buyItemStock(item, stock)} />;
            })
          : tab === "patches"
          ? ShopPatches.map((patch) => {
              const level = hydrated ? progress.patchLevels[patch.id] ?? 1 : 1;
              return (
                <PowerUpCard
                  key={patch.id}
                  patch={patch}
                  owned={patchUnlocked(patch, inventory)}
                  level={level}
                  balance={balance}
                  onBuy={() => buyPatch(patch)}
                  onUpgrade={() => upgradePatch(patch, level)}
                />
              );
            })
          : SkinList.map((skin) => (
              <SkinCard
                key={skin.id}
                skin={skin}
                owned={ownsSkin(inventory, skin.id)}
                equipped={equipped === skin.id}
                balance={balance}
                onBuy={() => buySkin(skin)}
                onEquip={() => {
                  playSfx("equip");
                  glitchIn(skin, 150);
                  progressStore.equipSkin(skin.id);
                }}
              />
            ))}
      </ul>
    </Screen>
  );
}
