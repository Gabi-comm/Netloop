"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./installPrompt.module.css";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

type Mode = "native" | "ios" | "manual";

const SHOW_DELAY_MS = 1200;

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function InstallPrompt() {
  const pathname = usePathname();
  const [deferred, setDeferred] = useState<InstallEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("manual");

  useEffect(() => {
    if (isStandalone()) return;
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallEvent);
      setMode("native");
    };
    const onInstalled = () => {
      setOpen(false);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if (isIos()) setMode("ios");
    const t = window.setTimeout(() => setOpen(true), SHOW_DELAY_MS);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!open || pathname.startsWith("/play") || pathname.startsWith("/endless")) return null;

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setOpen(false);
  };

  return (
    <div className={styles.backdrop} onClick={() => setOpen(false)}>
      <section
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.head}>
          <img className={styles.icon} src="/icons/icon-192.png" width={60} height={60} alt="" />
          <div className={styles.names}>
            <h2 id="install-title" className={styles.title}>Add Netloop to your Home Screen</h2>
            <p className={styles.sub}>play full screen, like a real app. works offline too.</p>
          </div>
        </div>

        {mode === "ios" && (
          <ol className={styles.steps}>
            <li>
              tap <ShareIcon /> <b>Share</b> in Safari&apos;s toolbar
            </li>
            <li>
              choose <b>Add to Home Screen</b> <PlusIcon />
            </li>
          </ol>
        )}
        {mode === "manual" && (
          <ol className={styles.steps}>
            <li>
              open your browser menu <b>⋮</b>
            </li>
            <li>
              tap <b>Install app</b> or <b>Add to Home screen</b>
            </li>
          </ol>
        )}

        <div className={styles.buttons}>
          {mode === "native" && deferred ? (
            <button type="button" className={styles.primary} onClick={install}>
              INSTALL
            </button>
          ) : (
            <button type="button" className={styles.primary} onClick={() => setOpen(false)}>
              GOT IT
            </button>
          )}
          <button type="button" className={styles.later} onClick={() => setOpen(false)}>
            not now
          </button>
        </div>
      </section>
    </div>
  );
}

function ShareIcon() {
  return (
    <svg className={styles.inlineIcon} viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 2 V12 M6 6 L10 2 L14 6 M5 9 H4 V18 H16 V9 H15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className={styles.inlineIcon} viewBox="0 0 20 20" aria-hidden="true">
      <rect x="3" y="3" width="14" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10 7 V13 M7 10 H13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
