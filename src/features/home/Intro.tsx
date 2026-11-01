"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import styles from "./intro.module.css";

const INTRO_MS = 6200;
const LEAVE_MS = 550;
const CABLE = "M-20 70 C 60 70, 130 36, 200 54 S 252 92 262 104";
const malware = "M18 60 Q14 34 38 28 Q48 18 60 26 Q84 26 82 54 Q86 78 58 80 Q30 86 18 60 Z";
const legit = "M20 56 Q18 30 46 26 Q76 22 80 50 Q83 74 56 78 Q24 82 20 56 Z";

const INVADERS = [
  { path: "M-20 70 C 40 70, 70 62, 96 60 Q 108 110 106 176", begin: 1.5 },
  { path: "M-20 70 C 50 68, 100 50, 142 48 Q 154 104 152 168", begin: 1.75 },
  { path: "M-20 70 C 60 70, 130 40, 186 52 Q 200 112 198 178", begin: 2.0 },
];
const INVADER_S = 1.1;
const PACKETS = [0.45, 0.75, 1.05];
const PACKET_S = 1;
const MOTION_END_S = 3.4;
const LETTERS = ["N", "E", "T", "L", "O", "O", "P"];

let played = false;

const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2);

function place(route: SVGPathElement | null, body: SVGGElement | null, p: number | null) {
  if (!route || !body) return;
  if (p === null) {
    body.setAttribute("opacity", "0");
    return;
  }
  const pt = route.getPointAtLength(route.getTotalLength() * p);
  body.setAttribute("opacity", "1");
  body.setAttribute("transform", `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
}

function Malware() {
  return (
    <g transform="scale(0.42) translate(-50 -88)">
      <path d={malware} fill="#e8553d" />
      <circle cx="40" cy="52" r="3.6" fill="#121212" />
      <circle cx="62" cy="52" r="3.6" fill="#121212" />
      <path d="M32 41 L46 46 M70 41 L56 46 M40 66 L45 62 L50 66 L55 62 L60 66" stroke="#121212" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32 80 L30 90 M66 80 L68 90" stroke="#e8553d" strokeWidth="5" strokeLinecap="round" />
    </g>
  );
}

export function Intro() {
  const [show, setShow] = useState(() => !played);
  const [leaving, setLeaving] = useState(false);
  const cable = useRef<SVGPathElement>(null);
  const packets = useRef<(SVGGElement | null)[]>([]);
  const routes = useRef<(SVGPathElement | null)[]>([]);
  const invaders = useRef<(SVGGElement | null)[]>([]);

  useEffect(() => {
    if (!show) return;
    played = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShow(false);
      return;
    }
    const leave = window.setTimeout(() => setLeaving(true), INTRO_MS - LEAVE_MS);
    const done = window.setTimeout(() => setShow(false), INTRO_MS);
    return () => {
      window.clearTimeout(leave);
      window.clearTimeout(done);
    };
  }, [show]);

  useEffect(() => {
    if (!show) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      PACKETS.forEach((begin, i) => {
        const p = (t - begin) / PACKET_S;
        place(cable.current, packets.current[i], p < 0 || p > 1 ? null : p);
      });
      INVADERS.forEach((m, i) => {
        const p = (t - m.begin) / INVADER_S;
        place(routes.current[i], invaders.current[i], p < 0 ? null : easeInOut(Math.min(1, p)));
      });
      if (t < MOTION_END_S) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [show]);

  if (!show) return null;

  return (
    <div className={`${styles.intro} ${leaving ? styles.leaving : ""}`} aria-hidden="true">
      <svg className={styles.stage} viewBox="0 0 320 250">
        <path className={styles.cableBase} d={CABLE} fill="none" stroke="#0b0b0b" strokeWidth="10" strokeLinecap="round" pathLength={100} />
        <path ref={cable} className={styles.cable} d={CABLE} fill="none" stroke="#3b6fd4" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="6 7" />
        {INVADERS.map((m, i) => (
          <path key={i} ref={(el) => { routes.current[i] = el; }} d={m.path} fill="none" stroke="none" />
        ))}

        <ellipse cx="150" cy="196" rx="124" ry="32" fill="#0e0e0d" className={styles.platform} />
        <ellipse cx="150" cy="190" rx="124" ry="32" fill="#1a1a19" stroke="#333330" strokeWidth="2.5" className={styles.platform} />
        <ellipse cx="150" cy="188" rx="104" ry="25" fill="none" stroke="#5fd3e0" strokeWidth="4" className={styles.ring} />
        <ellipse cx="150" cy="188" rx="104" ry="25" fill="none" stroke="#5fd3e0" strokeWidth="3" className={styles.pulse} />

        <g className={styles.rack}>
          <path d="M240 98 Q240 92 248 92 L280 92 Q288 92 288 98 L288 194 L240 194 Z" fill="#3b6fd4" />
          {[0, 1, 2, 3].map((u) => (
            <g key={u} transform={`translate(244 ${100 + u * 23})`}>
              <path d="M0 2 Q0 0 3 0 L37 0 Q40 0 40 2 L40 17 Q40 19 37 19 L3 19 Q0 19 0 17 Z" fill="#6f8fe0" />
              <path d="M6 6 L22 6 M6 12 L17 12" stroke="#2f4f9f" strokeWidth="2.5" strokeLinecap="round" />
              <circle className={styles.led} style={{ "--i": u } as CSSProperties} cx="33" cy="9.5" r="2.8" />
            </g>
          ))}
          <path className={styles.faceCalm} d="M252 84 Q256 80 260 84 M268 84 Q272 80 276 84" stroke="#121212" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path className={styles.faceAlarm} d="M252 80 L260 84 M276 80 L268 84" stroke="#121212" strokeWidth="3" fill="none" strokeLinecap="round" />
          <g className={styles.alarm}>
            <circle cx="290" cy="70" r="11" fill="#e8553d" />
            <path d="M290 63 L290 71 M290 76 L290 76.5" stroke="#121212" strokeWidth="3.4" strokeLinecap="round" />
          </g>
        </g>

        {PACKETS.map((_, i) => (
          <g key={i} ref={(el) => { packets.current[i] = el; }} opacity="0">
            <g transform="scale(0.24) translate(-50 -52)">
              <path d={legit} fill="#8ad15b" />
              <path d="M38 50 Q42 45 46 50 M56 49 Q60 44 64 49" stroke="#121212" strokeWidth="4" fill="none" strokeLinecap="round" />
            </g>
          </g>
        ))}

        {INVADERS.map((m, i) => (
          <g key={i} ref={(el) => { invaders.current[i] = el; }} opacity="0">
            <ellipse className={styles.shadow} style={{ "--land": `${m.begin + INVADER_S}s` } as CSSProperties} cx="0" cy="2" rx="14" ry="4" fill="#000" opacity="0.4" />
            <g className={styles.invader} style={{ "--land": `${m.begin + INVADER_S}s` } as CSSProperties}>
              <Malware />
            </g>
            <g className={styles.burst}>
              <circle cy="-14" r="12" fill="none" stroke="#e8553d" strokeWidth="3" />
              {[0, 1, 2, 3, 4, 5].map((k) => (
                <circle key={k} cx={Math.cos((k / 6) * Math.PI * 2) * 22} cy={-14 + Math.sin((k / 6) * Math.PI * 2) * 22} r="3.5" fill={k % 2 ? "#ede06a" : "#e8553d"} />
              ))}
            </g>
          </g>
        ))}

        <g className={styles.bit}>
          <image href="/sprites/svg/bit_draw_0.svg" x="22" y="140" width="56" height="56" />
        </g>

        <path
          className={styles.loop}
          pathLength={100}
          d="M80 168 Q72 128 122 118 Q176 108 218 132 Q244 158 216 186 Q174 206 120 200 Q78 194 80 166 Q82 152 96 144"
          fill="none"
          stroke="#f2f2ec"
          strokeWidth="5.5"
          strokeLinecap="round"
        />
        <text className={styles.plus} x="152" y="116" textAnchor="middle">
          +3
        </text>
      </svg>

      <div className={styles.title}>
        {LETTERS.map((ch, i) => (
          <span key={i} className={`${styles.letter} ${i < 3 ? styles.net : ""}`} style={{ animationDelay: `${4250 + i * 70}ms` }}>
            {ch}
          </span>
        ))}
      </div>
      <div className={styles.rule} />
    </div>
  );
}
