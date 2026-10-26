"use client";
import { NetworkDownView } from "@/features/play/ResultView";
import { createRun } from "@/game/runState";
export default function P() {
  const run = createRun(5);
  run.wave = 3;
  run.score = 2480;
  run.breaches = ["malware", "botnet", "trojan"];
  return <NetworkDownView run={run} onRetry={() => {}} onQuit={() => {}} />;
}
