"use client";

import { useEffect, useState } from "react";
import { spriteUrl, type SpriteAnim } from "@/game/sprites";

type SpriteProps = {
  anim: SpriteAnim;
  size: number;
  label?: string;
  playing?: boolean;
  className?: string;
};

export function Sprite({ anim, size, label, playing = true, className }: SpriteProps) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!playing || anim.frames <= 1 || anim.frameMs <= 0) return;
    let index = 0;
    const id = window.setInterval(() => {
      index = anim.loop ? (index + 1) % anim.frames : Math.min(index + 1, anim.frames - 1);
      setFrame(index);
    }, anim.frameMs);
    return () => window.clearInterval(id);
  }, [anim, playing]);

  return (
    <img
      src={spriteUrl(anim.name, playing ? frame : 0)}
      width={size}
      height={size}
      alt={label ?? ""}
      aria-hidden={label ? undefined : true}
      draggable={false}
      className={className}
      style={{ display: "block", userSelect: "none" }}
    />
  );
}
