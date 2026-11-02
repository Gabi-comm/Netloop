"use client";

import { useEffect } from "react";
import { music } from "@/lib/music";
import { onUserGesture } from "@/lib/sfx";

export function MusicPlayer() {
  useEffect(() => {
    const off = onUserGesture(() => music.start());
    const onVisibility = () => music.resumeIfHidden();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      off();
      document.removeEventListener("visibilitychange", onVisibility);
      music.stop();
    };
  }, []);

  return null;
}
