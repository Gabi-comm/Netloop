"use client";

import { useEffect, useState, type ReactNode } from "react";
import { NetColors } from "@/game/colors";
import type { PacketKindId } from "@/game/kinds";
import { frameAt, spriteUrl, Sprites, type SpriteAnim } from "@/game/sprites";

const PERIOD = 3800;
const Y = 86;
const SIZE = 46;

const seg = (t: number, a: number, b: number) => Math.max(0, Math.min(1, (t - a) / (b - a)));
const during = (t: number, a: number, b: number) => t >= a && t < b;

function useClock(period: number): number {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      setT((now - start) % period);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [period]);
  return t;
}

function Spr({ anim, t, x, y = Y, size = SIZE, opacity = 1 }: { anim: SpriteAnim; t: number; x: number; y?: number; size?: number; opacity?: number }) {
  return <image href={spriteUrl(anim.name, frameAt(anim, t))} x={x - size / 2} y={y - size / 2} width={size} height={size} opacity={opacity} />;
}

function Loop({ t, a, b, cx, cy = Y, rx = 32, ry = 30 }: { t: number; a: number; b: number; cx: number; cy?: number; rx?: number; ry?: number }) {
  if (!during(t, a, b + 160)) return null;
  const p = seg(t, a, b);
  const fade = 1 - seg(t, b, b + 160);
  const d = `M ${cx - rx} ${cy} a ${rx} ${ry} 0 1 0 ${rx * 2} 0 a ${rx} ${ry} 0 1 0 ${-rx * 2} 0`;
  return (
    <g opacity={fade}>
      <path d={d} pathLength={100} fill="none" stroke={NetColors.chalk} strokeWidth={3.5} strokeLinecap="round" strokeDasharray="100 100" strokeDashoffset={100 * (1 - p)} />
      {p < 1 && <circle cx={cx - rx} cy={cy} r={6} fill="none" stroke={NetColors.points} strokeWidth={2.5} />}
    </g>
  );
}

function Pop({ t, at, x, y = Y }: { t: number; at: number; x: number; y?: number }) {
  if (!during(t, at, at + 220)) return null;
  return <Spr anim={Sprites.malware_pop} t={t - at} x={x} y={y} size={SIZE * 1.3} />;
}

function Float({ t, a, text, x, y = Y - 34, color = NetColors.points }: { t: number; a: number; text: string; x: number; y?: number; color?: string }) {
  if (!during(t, a, a + 900)) return null;
  const k = seg(t, a, a + 900);
  return (
    <text x={x} y={y - k * 18} textAnchor="middle" fill={color} opacity={1 - k * k} style={{ fontFamily: "var(--font-display)", fontSize: 20 }}>
      {text}
    </text>
  );
}

function Pips({ x, hp, max }: { x: number; hp: number; max: number }) {
  return (
    <g>
      {Array.from({ length: max }, (_, i) => (
        <circle key={i} cx={x + (i - (max - 1) / 2) * 9} cy={Y - 32} r={3.2} fill={i < hp ? NetColors.points : NetColors.line} />
      ))}
    </g>
  );
}

const scenes: Partial<Record<PacketKindId, (t: number) => ReactNode>> = {
  legit: (t) => {
    const x = 30 + 225 * seg(t, 0, 2800);
    return (
      <>
        <Spr anim={Sprites.server_idle} t={t} x={276} y={80} size={54} />
        {t < 2800 && <Spr anim={Sprites.legit_walk} t={t} x={x} />}
        <Float t={t} a={2800} text="+10" x={262} color={NetColors.legit} />
      </>
    );
  },
  malware: (t) => {
    const x = 40 + Math.min(t, 2100) * 0.05;
    return (
      <>
        {t < 2100 && <Spr anim={Sprites.malware_walk} t={t} x={x} />}
        <Loop t={t} a={1200} b={2100} cx={x} />
        <Pop t={t} at={2100} x={x} />
        <Float t={t} a={2100} text="+100" x={x} />
      </>
    );
  },
  pingFlood: (t) => {
    const x = 60 + Math.min(t, 2100) * 0.05;
    const offsets: [number, number][] = [[-30, -4], [0, 6], [28, -6]];
    return (
      <>
        {t < 2100 && offsets.map(([dx, dy], i) => <Spr key={i} anim={Sprites.ping_flood_swarm} t={t + i * 90} x={x + dx} y={Y + dy} size={32} />)}
        <Loop t={t} a={1200} b={2100} cx={x} rx={60} ry={30} />
        {offsets.map(([dx, dy], i) => <Pop key={i} t={t} at={2100} x={x + dx} y={Y + dy} />)}
        <Float t={t} a={2100} text="one loop, all three!" x={150} />
      </>
    );
  },
  zeroDay: (t) => {
    const hitT = 1844;
    const x = t < 1300 ? 20 + t * 0.06 : t < hitT ? 98 + (t - 1300) * 0.16 : 185 + (t - hitT) * 0.06;
    const dashing = during(t, 1300, hitT);
    return (
      <>
        {t < hitT && (
          <path d="M30 28 Q110 14 168 60 Q196 88 192 132" pathLength={100} fill="none" stroke={NetColors.chalk} strokeWidth={3.5} strokeLinecap="round" strokeDasharray="100 100" strokeDashoffset={100 * (1 - seg(t, 0, 1500))} />
        )}
        <Spr anim={dashing ? Sprites.zero_day_dash : Sprites.zero_day_spin} t={t} x={x} />
        {during(t, hitT, hitT + 160) && <Spr anim={Sprites.fx_line_break} t={t - hitT} x={190} y={100} size={50} />}
        <Float t={t} a={hitT} text="line broken!" x={190} color={NetColors.pink} />
      </>
    );
  },
  worm: (t) => {
    const x = 40 + Math.min(t, 2000) * 0.045;
    const x0 = 40 + 2000 * 0.045;
    const after = Math.max(0, t - 2000) * 0.06;
    return (
      <>
        {t < 2000 && <Spr anim={Sprites.worm_crawl} t={t} x={x} size={50} />}
        <Loop t={t} a={1100} b={2000} cx={x} />
        <Pop t={t} at={2000} x={x0} />
        {t >= 2000 && <Spr anim={Sprites.worm_mini_crawl} t={t} x={x0 - 18 + after} size={34} />}
        {t >= 2000 && <Spr anim={Sprites.worm_mini_crawl} t={t + 60} x={x0 - 54 + after} size={34} />}
        <Float t={t} a={2100} text="split in two!" x={x0} color={NetColors.epicLight} />
      </>
    );
  },
  ransomware: (t) => {
    const x = 40 + Math.min(t, 2700) * 0.035;
    return (
      <>
        {t < 2700 && <Spr anim={t >= 1500 ? Sprites.ransomware_cracked : Sprites.ransomware_walk} t={t} x={x} />}
        {t < 2700 && <Pips x={x} hp={t >= 1500 ? 1 : 2} max={2} />}
        <Loop t={t} a={800} b={1500} cx={x} />
        <Float t={t} a={1500} text="cracked!" x={x} />
        <Loop t={t} a={2000} b={2700} cx={x} />
        <Pop t={t} at={2700} x={x} />
        <Float t={t} a={2700} text="+250" x={x} />
      </>
    );
  },
  spoofer: (t) => {
    const x = 30 + Math.min(t, 2900) * 0.06;
    const reveal = t % 1100 > 760;
    return (
      <>
        {t < 2900 && <Spr anim={reveal ? Sprites.spoofer_walk : Sprites.legit_walk} t={t} x={x} />}
        {t < 2200 && reveal && (
          <text x={x} y={Y - 34} textAnchor="middle" fill={NetColors.threat} style={{ fontFamily: "var(--font-display)", fontSize: 20 }}>
            fake!
          </text>
        )}
        <Loop t={t} a={2200} b={2900} cx={x} />
        <Pop t={t} at={2900} x={x} />
        <Float t={t} a={2900} text="+150" x={x} />
      </>
    );
  },
  trojan: (t) => {
    const x = 40 + 150 * seg(t, 0, 1500);
    const after = Math.max(0, t - 1830) * 0.05;
    return (
      <>
        <Spr anim={Sprites.server_idle} t={t} x={278} y={80} size={50} />
        {t < 1500 && <Spr anim={Sprites.trojan_idle} t={t} x={x} size={50} />}
        {during(t, 1500, 1830) && <Spr anim={Sprites.trojan_open} t={t - 1500} x={190} size={50} />}
        {t >= 1830 && <Spr anim={Sprites.malware_walk} t={t} x={176 + after} size={40} />}
        {t >= 1830 && <Spr anim={Sprites.malware_walk} t={t + 90} x={206 + after} size={40} />}
        <Float t={t} a={1600} text="surprise!" x={190} color={NetColors.threat} />
      </>
    );
  },
  mitm: (t) => {
    const lx = 90 + t * 0.05;
    const mx = Math.min(lx, 90 + 2100 * 0.05) - 50;
    return (
      <>
        <Spr anim={Sprites.legit_walk} t={t} x={lx} />
        {t < 2100 && <Spr anim={Sprites.mitm_walk} t={t} x={mx} />}
        <Loop t={t} a={1300} b={2100} cx={mx} rx={24} ry={28} />
        <Pop t={t} at={2100} x={mx} />
        <Float t={t} a={2100} text="only the spy!" x={mx + 20} />
      </>
    );
  },
  botnet: (t) => {
    const x = 70 + Math.min(t, 2800) * 0.025;
    const hp = 3 - [900, 1800, 2700].filter((end) => t >= end).length;
    return (
      <>
        {t < 2800 && <Spr anim={Sprites.botnet_orbit} t={t} x={x} size={60} />}
        {t < 2800 && <Pips x={x} hp={hp} max={3} />}
        <Loop t={t} a={400} b={900} cx={x} rx={40} ry={38} />
        <Loop t={t} a={1300} b={1800} cx={x} rx={40} ry={38} />
        <Loop t={t} a={2200} b={2700} cx={x} rx={40} ry={38} />
        <Pop t={t} at={2800} x={x} />
        <Float t={t} a={2800} text="+300" x={x} />
      </>
    );
  },
};

export function BehaviorDemo({ kind, label }: { kind: PacketKindId; label: string }) {
  const t = useClock(PERIOD);
  const scene = scenes[kind];
  return (
    <svg role="img" aria-label={label} viewBox="0 0 300 140" width="100%" style={{ display: "block", overflow: "hidden" }}>
      <path d="M-10 104 Q150 112 310 100" fill="none" stroke={NetColors.cable} strokeWidth={5} strokeLinecap="round" />
      {scene?.(t)}
    </svg>
  );
}
