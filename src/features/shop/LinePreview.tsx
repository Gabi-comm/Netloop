"use client";

import { useEffect, useRef } from "react";
import { drawBitLine } from "@/game/bitLine";
import type { LineStyle } from "@/game/skins";

const HEIGHT = 44;

function wave(width: number): { x: number; y: number }[] {
  const pad = 14;
  const points = [];
  for (let x = pad; x <= width - pad; x += 3) {
    const t = (x - pad) / (width - pad * 2);
    points.push({ x, y: HEIGHT / 2 + Math.sin(t * Math.PI * 3) * 11 });
  }
  return points;
}

export function LinePreview({ style, label }: { style: LineStyle; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const width = canvas.clientWidth;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(HEIGHT * dpr);
    const points = wave(width);
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    const paint = (now: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, HEIGHT);
      drawBitLine(ctx, points, style, 0.85, now);
      if (!still && style.kind === "stars") raf = requestAnimationFrame(paint);
    };
    paint(0);
    if (!still && style.kind === "stars") raf = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(raf);
  }, [style]);

  return <canvas ref={ref} role="img" aria-label={label} style={{ width: "100%", height: HEIGHT, display: "block" }} />;
}
