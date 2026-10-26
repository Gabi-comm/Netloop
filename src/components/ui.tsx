"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useProgress, useHydrated } from "@/lib/progress";
import { BackIcon, DataIcon } from "./Icons";
import styles from "./ui.module.css";

export function Screen({ children, doodles = true }: { children: ReactNode; doodles?: boolean }) {
  return (
    <main className={styles.screen}>
      {doodles && <Doodles />}
      <div className={styles.column}>{children}</div>
    </main>
  );
}

export function Doodles() {
  return (
    <svg aria-hidden="true" className={styles.doodles} viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
      <g fill="none" stroke="#333330" strokeWidth="2.5" strokeLinecap="round">
        <path d="M40 120 L43 110 M47 120 L47 109 M53 120 L51 111" />
        <path d="M318 96 L321 86 M325 96 L325 85 M331 96 L329 87" />
        <path d="M24 470 L27 460 M31 470 L31 459 M37 470 L35 461" />
        <path d="M352 520 L355 510 M359 520 L359 509 M365 520 L363 511" />
        <path d="M180 806 L183 796 M187 806 L187 795 M193 806 L191 797" />
        <path d="M300 640 L303 630 M307 640 L307 629 M313 640 L311 631" />
        <path d="M60 700 L63 690 M67 700 L67 689 M73 700 L71 691" />
      </g>
      <g fill="#262624">
        <rect x="200" y="180" width="7" height="4" rx="1" transform="rotate(-12 203 182)" />
        <rect x="80" y="610" width="6" height="4" rx="1" />
        <rect x="340" y="760" width="8" height="5" rx="1" transform="rotate(20 344 762)" />
        <rect x="22" y="300" width="6" height="4" rx="1" />
      </g>
    </svg>
  );
}

export function DataPill() {
  const progress = useProgress();
  const hydrated = useHydrated();
  const previous = useRef(progress.data);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    if (progress.data === previous.current) return;
    previous.current = progress.data;
    setBump(true);
    const id = window.setTimeout(() => setBump(false), 450);
    return () => window.clearTimeout(id);
  }, [progress.data]);

  return (
    <div className={styles.pill} aria-label={`${progress.data} data`}>
      <DataIcon />
      <span className={`${styles.pillValue} ${bump ? styles.pillBump : ""}`}>{hydrated ? progress.data.toLocaleString() : "–"}</span>
      <span>data</span>
    </div>
  );
}

export function IconLink({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <Link href={href} aria-label={label} className={styles.iconButton}>
      {children}
    </Link>
  );
}

export function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className={styles.iconButton}>
      {children}
    </button>
  );
}

export function TopBar({ title, backHref = "/", right }: { title: string; backHref?: string; right?: ReactNode }) {
  return (
    <header className={styles.topBar}>
      <IconLink href={backHref} label="Back">
        <BackIcon />
      </IconLink>
      <h1 className={styles.topTitle}>{title}</h1>
      {right ?? <span style={{ width: 46 }} />}
    </header>
  );
}

type ChunkyTone = "pink" | "yellow" | "ghost";
type ChunkySize = "normal" | "big" | "small";

function chunkyClass(tone: ChunkyTone, size: ChunkySize) {
  return [styles.chunky, styles[tone], size === "big" ? styles.big : size === "small" ? styles.small : ""].join(" ");
}

export function ChunkyLink({
  href, children, tone = "pink", size = "normal", disabled = false,
}: { href: string; children: ReactNode; tone?: ChunkyTone; size?: ChunkySize; disabled?: boolean }) {
  if (disabled) {
    return (
      <span className={chunkyClass(tone, size)} aria-disabled="true">
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={chunkyClass(tone, size)}>
      {children}
    </Link>
  );
}

export function ChunkyButton({
  onClick, children, tone = "pink", size = "normal", disabled = false,
}: { onClick: () => void; children: ReactNode; tone?: ChunkyTone; size?: ChunkySize; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={chunkyClass(tone, size)}>
      {children}
    </button>
  );
}

export function DashedRule({ width = 300 }: { width?: number }) {
  return (
    <svg aria-hidden="true" className={styles.rule} style={{ width: `min(${width}px, 80%)` }} viewBox={`0 0 ${width} 10`} preserveAspectRatio="none">
      <path d={`M4 5 L${width - 4} 5`} stroke="var(--chalk)" strokeWidth="4" strokeLinecap="round" strokeDasharray="14 11" />
    </svg>
  );
}

export function UptimeBars({ value, max, label = true }: { value: number; max: number; label?: boolean }) {
  const previous = useRef(value);
  const [lostIndex, setLostIndex] = useState<number | null>(null);

  useEffect(() => {
    if (value < previous.current) {
      setLostIndex(value);
      const id = window.setTimeout(() => setLostIndex(null), 520);
      previous.current = value;
      return () => window.clearTimeout(id);
    }
    previous.current = value;
  }, [value]);

  return (
    <div className={styles.uptime} role="img" aria-label={`uptime ${value} of ${max}`}>
      {label && <span className={styles.uptimeLabel}>uptime</span>}
      {Array.from({ length: max }, (_, i) => (
        <div key={i} className={`${styles.uptimeBar} ${i >= value ? styles.uptimeEmpty : ""} ${i === lostIndex ? styles.uptimeLost : ""}`} />
      ))}
    </div>
  );
}

export function Chip({ children }: { children: ReactNode }) {
  return <span className={styles.chip}>{children}</span>;
}

export function Soon() {
  return <span className={styles.soon}>soon</span>;
}

export function Sheet({ open, onClose, label, children }: { open: boolean; onClose: () => void; label: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className={styles.sheetBackdrop} onClick={onClose}>
      <section role="dialog" aria-modal="true" aria-label={label} className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.sheetGrip} />
        {children}
      </section>
    </div>
  );
}

export const ui = styles;
