"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { endlessReward } from "@/data/stages";
import { createRun, starsFor, type RunState } from "@/game/runState";
import { SpriteCache } from "@/game/renderer";
import type { Patch } from "@/game/patches";
import { isStageUnlocked, progressStore, useHydrated, useProgress } from "@/lib/progress";
import { FightView } from "./FightView";
import { PowerUpView } from "./PowerUpView";
import { NetworkDownView, ZoneClearedView, type EndlessResult, type StageReward } from "./ResultView";
import styles from "./play.module.css";

type View = "fight" | "powerup" | "cleared" | "lost";

function rewardFor(run: RunState): StageReward {
  const stars = starsFor(run);
  const stageReward = run.stage.reward;
  const packetData = run.dataEarned;
  const starBonus = stars * 10;
  return { stars, stageReward, packetData, starBonus, total: stageReward + packetData + starBonus };
}

export function PlayScreen({ stageId }: { stageId: number }) {
  const router = useRouter();
  const progress = useProgress();
  const hydrated = useHydrated();
  const [attempt, setAttempt] = useState(0);
  const [run, setRun] = useState(() => createRun(stageId));
  const [view, setView] = useState<View>("fight");
  const [reward, setReward] = useState<StageReward | null>(null);
  const [endlessResult, setEndlessResult] = useState<EndlessResult | null>(null);
  const [sprites] = useState(() => new SpriteCache());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    sprites.load().then(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, [sprites]);

  useEffect(() => {
    if (hydrated && !isStageUnlocked(progress, stageId)) router.replace("/zones");
  }, [hydrated, progress, stageId, router]);

  const restart = useCallback(() => {
    setAttempt((a) => a + 1);
    setRun(createRun(stageId, attempt + 1));
    setReward(null);
    setEndlessResult(null);
    setView("fight");
  }, [stageId, attempt]);

  const quit = useCallback(() => router.push(run.stage.endless ? "/" : "/zones"), [router, run]);

  const onLost = useCallback(() => {
    if (run.stage.endless) {
      const survived = run.wave - 1;
      const total = endlessReward(survived, run.dataEarned);
      const previous = progressStore.recordEndless(survived, run.score, total);
      setEndlessResult({ survived, reward: total, previous });
    }
    setView("lost");
  }, [run]);

  const onCleared = useCallback(() => {
    if (run.wave < run.maxWaves) {
      setView("powerup");
      return;
    }
    const r = rewardFor(run);
    progressStore.recordStageClear(run.stage.id, run.score, r.stars, r.total);
    setReward(r);
    setView("cleared");
  }, [run]);

  const onInstall = useCallback(
    (patch: Patch | null) => {
      if (patch) run.patches.push(patch.id);
      run.wave += 1;
      setView("fight");
    },
    [run],
  );

  if (!ready) {
    return (
      <div className={styles.stage}>
        <div className={styles.loading}>booting the firewall…</div>
      </div>
    );
  }

  switch (view) {
    case "fight":
      return (
        <FightView
          key={`${attempt}-${run.wave}`}
          run={run}
          sprites={sprites}
          onCleared={onCleared}
          onLost={onLost}
          onRestart={restart}
          onQuit={quit}
        />
      );
    case "powerup":
      return <PowerUpView key={`${attempt}-${run.wave}`} run={run} onInstall={onInstall} />;
    case "cleared":
      return <ZoneClearedView run={run} reward={reward!} onContinue={quit} onReplay={restart} />;
    case "lost":
      return <NetworkDownView run={run} endless={endlessResult ?? undefined} onRetry={restart} onQuit={quit} />;
  }
}
