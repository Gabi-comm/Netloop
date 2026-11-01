"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { pointInPolygon, type Vec } from "@/game/geometry";
import styles from "./home.module.css";

const ARENA = { x: 150, y: 148, rx: 118, ry: 46 };
const ROAM = { rx: 92, ry: 30 };
const RESPAWN_MS = 1500;
const POP_MS = 800;

type Critter = { id: number; kind: "malware" | "legit"; x: number; y: number; vx: number; vy: number; hiddenUntil: number; spawn: number; scaredUntil: number };
type Burst = { id: number; x: number; y: number; at: number; text: string; bad: boolean };

const malware = "M18 60 Q14 34 38 28 Q48 18 60 26 Q84 26 82 54 Q86 78 58 80 Q30 86 18 60 Z";

const START: Critter[] = [
  { id: 0, kind: "malware", x: 112, y: 140, vx: 16, vy: 5, hiddenUntil: 0, spawn: 0, scaredUntil: 0 },
  { id: 1, kind: "malware", x: 158, y: 128, vx: -12, vy: 7, hiddenUntil: 0, spawn: 0, scaredUntil: 0 },
  { id: 2, kind: "malware", x: 192, y: 156, vx: 10, vy: -8, hiddenUntil: 0, spawn: 0, scaredUntil: 0 },
  { id: 3, kind: "legit", x: 86, y: 160, vx: 14, vy: -4, hiddenUntil: 0, spawn: 0, scaredUntil: 0 },
];

function outside(x: number, y: number) {
  return ((x - ARENA.x) / ROAM.rx) ** 2 + ((y - ARENA.y) / ROAM.ry) ** 2 > 1;
}

function randomSpot(): Vec {
  for (;;) {
    const x = ARENA.x + (Math.random() * 2 - 1) * ROAM.rx;
    const y = ARENA.y + (Math.random() * 2 - 1) * ROAM.ry;
    if (!outside(x, y)) return { x, y };
  }
}

function MalwareBody({ angry }: { angry: boolean }) {
  return (
    <>
      <path d={malware} fill="#e8553d" />
      <circle cx="40" cy="52" r="3.6" fill="#121212" />
      <circle cx="62" cy="52" r="3.6" fill="#121212" />
      <path
        d={angry ? "M32 41 L46 46 M70 41 L56 46 M40 66 L45 62 L50 66 L55 62 L60 66" : "M32 41 L46 46 M70 41 L56 46 M42 66 Q51 60 60 66"}
        stroke="#121212"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M32 80 L30 90 M66 80 L68 90" stroke="#e8553d" strokeWidth="5" strokeLinecap="round" />
    </>
  );
}

function LegitBody({ scared }: { scared: boolean }) {
  return (
    <>
      <path d="M20 56 Q18 30 46 26 Q76 22 80 50 Q83 74 56 78 Q24 82 20 56 Z" fill="#8ad15b" />
      {scared ? (
        <>
          <circle cx="42" cy="48" r="4.5" fill="#121212" />
          <circle cx="60" cy="47" r="4.5" fill="#121212" />
          <ellipse cx="51" cy="63" rx="5" ry="6" fill="#121212" />
        </>
      ) : (
        <path d="M38 50 Q42 45 46 50 M56 49 Q60 44 64 49" stroke="#121212" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      )}
      <path d="M32 80 L30 90 M66 79 L68 89" stroke="#8ad15b" strokeWidth="5" strokeLinecap="round" />
    </>
  );
}

function RackUnit({ y, delay, alert }: { y: number; delay: string; alert: boolean }) {
  return (
    <g transform={`translate(0 ${y})`}>
      <path d="M2 3 Q2 0 6 0 L46 0 Q50 0 50 3 L50 17 Q50 20 46 20 L6 20 Q2 20 2 17 Z" fill="#6f8fe0" />
      <path d="M9 7 L30 7 M9 13 L24 13" stroke="#2f4f9f" strokeWidth="3" strokeLinecap="round" />
      <circle className={styles.blink} style={{ animationDelay: delay }} cx="41" cy="10" r="3" fill={alert ? "#e8553d" : "#8ad15b"} />
    </g>
  );
}

export function HeroScene({ lineColor = "#f2f2ec" }: { lineColor?: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const critters = useRef<Critter[]>(START.map((c) => ({ ...c })));
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [trail, setTrail] = useState<Vec[] | null>(null);
  const [closed, setClosed] = useState<{ id: number; points: Vec[] } | null>(null);
  const [caught, setCaught] = useState(0);
  const [tried, setTried] = useState(false);
  const [now, setNow] = useState(0);
  const drawing = useRef<Vec[] | null>(null);
  const nextId = useRef(1);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const step = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      for (const c of critters.current) {
        if (t < c.hiddenUntil) continue;
        if (Math.random() < dt * 0.8) {
          const turn = (Math.random() - 0.5) * 1.6;
          const cos = Math.cos(turn);
          const sin = Math.sin(turn);
          [c.vx, c.vy] = [c.vx * cos - c.vy * sin, c.vx * sin + c.vy * cos];
        }
        const speed = c.kind === "legit" ? 1.2 : 1;
        const nx = c.x + c.vx * dt * speed;
        const ny = c.y + c.vy * dt * 0.6 * speed;
        if (outside(nx, ny)) {
          c.vx = (ARENA.x - c.x) * 0.25 + (Math.random() - 0.5) * 8;
          c.vy = (ARENA.y - c.y) * 0.6 + (Math.random() - 0.5) * 6;
        } else {
          c.x = nx;
          c.y = ny;
        }
      }
      setNow(t);
      setBursts((list) => (list.some((b) => t - b.at > POP_MS) ? list.filter((b) => t - b.at <= POP_MS) : list));
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  const toSvg = (e: PointerEvent<SVGSVGElement>): Vec | null => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  };

  const onDown = (e: PointerEvent<SVGSVGElement>) => {
    const p = toSvg(e);
    if (!p) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = [p];
    setTrail([p]);
    setTried(true);
  };

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!drawing.current) return;
    const p = toSvg(e);
    if (!p) return;
    const prev = drawing.current[drawing.current.length - 1];
    if (Math.hypot(p.x - prev.x, p.y - prev.y) < 3) return;
    drawing.current = [...drawing.current, p];
    setTrail(drawing.current);
  };

  const onUp = () => {
    const points = drawing.current;
    drawing.current = null;
    setTrail(null);
    if (!points || points.length < 8) return;
    const t = performance.now();
    const fresh: Burst[] = [];
    let got = 0;
    for (const c of critters.current) {
      if (t < c.hiddenUntil || !pointInPolygon({ x: c.x, y: c.y - 14 }, points)) continue;
      if (c.kind === "legit") {
        c.scaredUntil = t + 900;
        fresh.push({ id: nextId.current++, x: c.x, y: c.y - 30, at: t, text: "oops!", bad: true });
        continue;
      }
      got++;
      fresh.push({ id: nextId.current++, x: c.x, y: c.y - 14, at: t, text: "+1", bad: false });
      c.hiddenUntil = t + RESPAWN_MS;
      Object.assign(c, randomSpot());
      c.spawn = t + RESPAWN_MS;
    }
    setClosed({ id: nextId.current++, points });
    setCaught((n) => n + got);
    setBursts((list) => [...list, ...fresh]);
  };

  const alive = critters.current.filter((c) => now >= c.hiddenUntil).sort((a, b) => a.y - b.y);
  const alert = critters.current.some((c) => c.kind === "malware" && now >= c.hiddenUntil && c.x > ARENA.x + ROAM.rx * 0.7);
  const path = (pts: Vec[], close = false) => pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + (close ? " Z" : "");

  return (
    <svg
      ref={svgRef}
      role="application"
      aria-label="Practice arena. Draw a loop around the red malware to drop them, and leave the green packet alone."
      viewBox="0 38 342 182"
      className={`${styles.hero} ${styles.heroLive}`}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <ellipse cx="300" cy="186" rx="40" ry="14" fill="#0e0e0d" />
      <ellipse cx="300" cy="180" rx="40" ry="14" fill="#1a1a19" stroke="#333330" strokeWidth="2.5" />
      <ellipse cx="300" cy="180" rx="30" ry="9" fill="none" stroke={alert ? "#e8553d" : "#3b6fd4"} strokeWidth="3" opacity="0.7" />

      <path d="M30 152 Q32 200 150 204 Q268 200 270 152 L270 164 Q268 214 150 216 Q32 214 30 164 Z" fill="#0e0e0d" />
      <ellipse cx={ARENA.x} cy={ARENA.y + 4} rx={ARENA.rx + 14} ry={ARENA.ry + 10} fill="#1a1a19" stroke="#333330" strokeWidth="2.5" />
      <ellipse cx={ARENA.x} cy={ARENA.y} rx={ARENA.rx} ry={ARENA.ry} fill="none" stroke="#5fd3e0" strokeWidth="12" opacity="0.1" />
      <ellipse className={styles.ringPulse} cx={ARENA.x} cy={ARENA.y} rx={ARENA.rx} ry={ARENA.ry} fill="none" stroke="#5fd3e0" strokeWidth="4" />
      <ellipse cx={ARENA.x} cy={ARENA.y} rx={ARENA.rx * 0.66} ry={ARENA.ry * 0.62} fill="none" stroke="#f2f2ec" strokeWidth="2" strokeDasharray="5 8" opacity="0.18" />
      <g fill="#5fd3e0">
        {[0.15, 0.32, 0.5, 0.68, 0.85].map((f, i) => {
          const a = Math.PI * (0.1 + f * 0.8);
          return <circle key={i} className={styles.blink} style={{ animationDelay: `${i * 0.25}s` }} cx={ARENA.x + Math.cos(a) * (ARENA.rx + 8)} cy={ARENA.y + 6 + Math.sin(a) * (ARENA.ry + 6)} r="2.4" />;
        })}
      </g>

      <path d="M262 176 Q252 168 254 160" stroke="#3b6fd4" strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray="2 7" className={styles.flow} />

      <g transform="translate(275 70)">
        <path d="M-2 -8 Q-2 -14 6 -14 L46 -14 Q54 -14 54 -8 L54 106 L-2 106 Z" fill="#3b6fd4" />
        <RackUnit y={-6} delay="0s" alert={alert} />
        <RackUnit y={20} delay="0.4s" alert={alert} />
        <RackUnit y={46} delay="0.8s" alert={alert} />
        <RackUnit y={72} delay="1.2s" alert={alert} />
        {alert ? (
          <path d="M12 -26 L20 -22 M40 -26 L32 -22" stroke="#121212" strokeWidth="3" strokeLinecap="round" />
        ) : (
          <path d="M12 -22 Q16 -26 20 -22 M32 -22 Q36 -26 40 -22" stroke="#121212" strokeWidth="3" fill="none" strokeLinecap="round" />
        )}
      </g>

      {closed && (
        <path key={closed.id} className={styles.snap} d={path(closed.points, true)} fill={lineColor} fillOpacity="0.12" stroke={lineColor} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      )}

      {alive.map((c) => (
        <g key={`${c.id}-${c.spawn}`} transform={`translate(${c.x.toFixed(1)} ${c.y.toFixed(1)})`}>
          <ellipse cx="0" cy="1" rx="14" ry="4" fill="#000" opacity="0.35" />
          <g className={c.spawn ? styles.dropIn : undefined}>
            <g transform={`scale(${c.vx < 0 ? -0.42 : 0.42} 0.42) translate(-50 -90)`}>
              <g className={c.kind === "malware" ? styles.wobble : styles.walk}>
                {c.kind === "malware" ? <MalwareBody angry /> : <LegitBody scared={now < c.scaredUntil} />}
              </g>
            </g>
          </g>
        </g>
      ))}

      {!tried && (
        <path className={styles.loop} pathLength={100} d="M84 144 Q76 108 122 98 Q178 86 214 112 Q238 138 206 168 Q160 186 112 176 Q78 166 84 140 Q88 128 98 120" fill="none" stroke="#f2f2ec" strokeWidth="5" strokeLinecap="round" />
      )}

      {trail && trail.length > 1 && (
        <path d={path(trail)} fill="none" stroke={lineColor} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      )}

      {bursts.map((b) => (
        <g key={b.id} transform={`translate(${b.x.toFixed(1)} ${b.y.toFixed(1)})`}>
          {!b.bad && (
            <g className={styles.burst}>
              <circle r="10" fill="none" stroke="#e8553d" strokeWidth="3" />
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <circle key={i} cx={Math.cos((i / 6) * Math.PI * 2) * 18} cy={Math.sin((i / 6) * Math.PI * 2) * 18} r="3.5" fill={i % 2 ? "#ede06a" : "#e8553d"} />
              ))}
            </g>
          )}
          <text className={styles.floatText} textAnchor="middle" fill={b.bad ? "#e8553d" : "#ede06a"}>
            {b.text}
          </text>
        </g>
      ))}

      <text x={ARENA.x} y="70" textAnchor="middle" className={styles.heroHint} fill={tried ? "#5fd3e0" : "#bdbdb5"}>
        {tried ? `dropped: ${caught}` : "try it! draw a loop"}
      </text>
    </svg>
  );
}
