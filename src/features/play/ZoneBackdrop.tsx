import type { CSSProperties } from "react";
import type { LayoutId } from "@/game/network";
import styles from "./backdrop.module.css";

const INK = "#121212";

const delay = (s: number) => ({ animationDelay: `${s}s` }) as CSSProperties;

function Planks({ y, color, line }: { y: number; color: string; line: string }) {
  return (
    <>
      <rect y={y} width="390" height={844 - y} fill={color} />
      <path d={`M0 ${y} L390 ${y}`} stroke={line} strokeWidth="5" />
      <g stroke={line} strokeWidth="2.5" strokeLinecap="round">
        {Array.from({ length: 9 }, (_, r) => {
          const yy = y + 34 + r * 42;
          const off = (r % 3) * 70;
          return <path key={r} d={`M${off - 40} ${yy} L${off + 120} ${yy} M${off + 170} ${yy} L${off + 330} ${yy} M${off + 380} ${yy} L${off + 520} ${yy}`} />;
        })}
      </g>
    </>
  );
}

function Tiles({ y, color, line, size = 56 }: { y: number; color: string; line: string; size?: number }) {
  const rows = Math.ceil((844 - y) / size);
  return (
    <>
      <rect y={y} width="390" height={844 - y} fill={color} />
      <g stroke={line} strokeWidth="2">
        {Array.from({ length: rows }, (_, r) => (
          <path key={`r${r}`} d={`M0 ${y + r * size} L390 ${y + r * size}`} />
        ))}
        {Array.from({ length: Math.ceil(390 / size) + 1 }, (_, c) => (
          <path key={`c${c}`} d={`M${c * size} ${y} L${c * size} 844`} />
        ))}
      </g>
    </>
  );
}

function Home() {
  return (
    <>
      <rect width="390" height="844" fill="#2b2420" />
      <g fill="#2f2722">
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x={i * 52 - 6} y="0" width="22" height="470" />
        ))}
      </g>
      <path d="M150 70 L330 70 L330 250 L150 250 Z" fill="#1a2140" stroke="#6b5646" strokeWidth="8" />
      <path d="M240 70 L240 250 M150 160 L330 160" stroke="#6b5646" strokeWidth="5" />
      <circle cx="292" cy="112" r="16" fill="#ede06a" opacity="0.5" />
      <g fill="#f2f2ec">
        <circle className={styles.twinkle} cx="180" cy="100" r="2" />
        <circle className={styles.twinkle} style={delay(-1)} cx="205" cy="190" r="1.6" />
        <circle className={styles.twinkle} style={delay(-0.4)} cx="270" cy="210" r="1.8" />
      </g>
      <path d="M136 60 Q160 160 140 262 L156 262 Q170 160 156 60 Z M344 60 Q320 160 340 262 L324 262 Q310 160 324 60 Z" fill="#7a3b36" />
      <path d="M126 58 L354 58" stroke="#8a7a5a" strokeWidth="6" strokeLinecap="round" />

      <path d="M24 300 L104 300 L104 380 L24 380 Z" fill="#3a302a" stroke="#6b5646" strokeWidth="5" />
      <path d="M30 374 L58 340 L74 356 L88 344 L100 374 Z" fill="#4f6b5a" />

      <path d="M0 430 L390 430 L390 470 L0 470 Z" fill="#3a2c24" />
      <Planks y={470} color="#4a3426" line="#5c4130" />

      <g className={styles.glow}>
        <ellipse cx="338" cy="360" rx="110" ry="120" fill="#ede06a" opacity="0.07" />
        <ellipse cx="338" cy="340" rx="56" ry="56" fill="#ede06a" opacity="0.09" />
      </g>
      <path d="M338 334 L338 560 M314 562 L362 562" stroke="#8a7a5a" strokeWidth="7" strokeLinecap="round" />
      <path d="M306 334 L370 334 L356 290 L320 290 Z" fill="#f3d36b" />

      <path d="M-30 560 Q-36 486 -8 480 L90 480 Q116 486 112 560 Z" fill="#d49a3a" />
      <path d="M-20 560 L100 560 L100 600 L-20 600 Z" fill="#c4862c" />
      <path d="M84 500 Q84 488 98 488 L112 488 Q124 490 124 504 L124 600 L84 600 Z" fill="#c4862c" />

      <ellipse cx="300" cy="660" rx="96" ry="22" fill="#3c5f63" opacity="0.7" />
      <g transform="translate(320 654)">
        <ellipse cx="0" cy="0" rx="34" ry="13" fill="#c98f2a" />
        <circle cx="28" cy="-10" r="12" fill="#c98f2a" />
        <path d="M21 -20 L24 -31 L31 -21 M30 -21 L35 -31 L39 -18" fill="#a8741f" />
        <path d="M24 -8 Q28 -5 32 -8" stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <path className={styles.tail} d="M-32 -4 Q-48 -18 -42 -28" stroke="#c98f2a" strokeWidth="7" fill="none" strokeLinecap="round" />
      </g>

      <path d="M18 470 L24 430 L54 430 L60 470 Z" fill="#7a5638" />
      <path d="M39 430 Q20 400 28 384 M39 430 Q38 394 48 380 M39 430 Q60 404 64 392" stroke="#6fb043" strokeWidth="6" fill="none" strokeLinecap="round" />
    </>
  );
}

function Cafe() {
  return (
    <>
      <rect width="390" height="844" fill="#2e2219" />
      <g stroke="#3a2b20" strokeWidth="3">
        {Array.from({ length: 22 }, (_, r) => (
          <path key={r} d={`M0 ${16 + r * 22} L390 ${16 + r * 22}`} />
        ))}
        {Array.from({ length: 22 }, (_, r) =>
          Array.from({ length: 5 }, (_, c) => {
            const x = c * 90 + (r % 2) * 45;
            return <path key={`${r}-${c}`} d={`M${x} ${16 + r * 22} L${x} ${38 + r * 22}`} />;
          }),
        )}
      </g>
      <path d="M210 290 L360 290 L360 410 L210 410 Z" fill="#1f2a24" stroke="#7a5638" strokeWidth="8" />
      <text x="285" y="322" textAnchor="middle" fill="#f2f2ec" opacity="0.75" fontSize="20" fontFamily="var(--font-display)">MENU</text>
      <path d="M228 344 L300 344 M228 364 L318 364 M228 384 L284 384" stroke="#f2f2ec" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
      <path d="M326 344 L342 344 M326 364 L342 364 M326 384 L342 384" stroke="#ede06a" strokeWidth="3" strokeLinecap="round" opacity="0.6" />

      {[70, 320].map((x, i) => (
        <g key={x} className={styles.swing} style={delay(-i * 1.3)}>
          <path d={`M${x} 0 L${x} 120`} stroke="#555" strokeWidth="3" />
          <path d={`M${x - 26} 144 L${x + 26} 144 L${x + 14} 120 L${x - 14} 120 Z`} fill="#3a3a38" />
          <ellipse cx={x} cy="158" rx="48" ry="28" fill="#ede06a" opacity="0.13" />
        </g>
      ))}

      <path d="M0 520 L390 520" stroke="#6b4a33" strokeWidth="6" />
      <Tiles y={520} color="#3d2a1d" line="#4a3424" size={48} />
      <g fill="#46301f">
        {Array.from({ length: 7 }, (_, r) =>
          Array.from({ length: 9 }, (_, c) => ((r + c) % 2 ? <rect key={`${r}-${c}`} x={c * 48} y={520 + r * 48} width="48" height="48" /> : null)),
        )}
      </g>

      <path d="M0 450 L170 450 L170 560 L0 560 Z" fill="#7a5638" />
      <path d="M0 450 L174 450" stroke="#9a6e48" strokeWidth="8" strokeLinecap="round" />
      <path d="M20 370 L110 370 L110 450 L20 450 Z" fill="#b8b8b0" />
      <path d="M30 382 L100 382 L100 404 L30 404 Z" fill="#8a8a82" />
      <path d="M48 404 L48 420 M82 404 L82 420" stroke="#555" strokeWidth="6" strokeLinecap="round" />
      <path d="M40 426 L56 426 L54 448 L42 448 Z M74 426 L90 426 L88 448 L76 448 Z" fill="#f2f2ec" />
      <path className={styles.steam} d="M60 362 Q50 344 60 330 Q70 316 60 298" stroke="#f2f2ec" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path className={styles.steam} style={delay(-1.1)} d="M80 362 Q70 346 80 332 Q90 318 80 302" stroke="#f2f2ec" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M128 428 L148 428 L145 450 L131 450 Z" fill="#f2f2ec" />

      <ellipse cx="320" cy="600" rx="54" ry="11" fill="#9a6e48" />
      <path d="M320 610 L320 680 M296 684 L344 684" stroke="#6b4a33" strokeWidth="7" strokeLinecap="round" />
      <path d="M310 572 L330 572 L328 592 L312 592 Z" fill="#f2f2ec" />
      <path className={styles.steam} style={delay(-0.5)} d="M320 566 Q314 554 320 544 Q326 534 320 522" stroke="#f2f2ec" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </>
  );
}

function School() {
  return (
    <>
      <rect width="390" height="844" fill="#1f2b27" />
      <path d="M40 60 L350 60 L350 250 L40 250 Z" fill="#2c4a3e" stroke="#5c4130" strokeWidth="10" />
      <path d="M40 252 L350 252" stroke="#6b4a33" strokeWidth="8" strokeLinecap="round" />
      <g stroke="#f2f2ec" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.45">
        <path d="M70 100 L160 100 M70 128 Q110 112 150 140" />
        <path d="M210 92 L230 120 L250 96 M262 92 L262 122" />
        <path d="M210 170 Q260 140 320 190" />
        <circle cx="300" cy="120" r="18" />
      </g>
      <path d="M262 300 L350 300 L350 380 L262 380 Z" fill="#e8e4d2" opacity="0.55" />
      <path d="M276 322 L336 322 M276 342 L322 342 M276 362 L330 362" stroke={INK} strokeWidth="3" strokeLinecap="round" opacity="0.6" />
      <path d="M30 300 L110 300 L110 360 L30 360 Z" fill="#e8e4d2" opacity="0.5" />
      <path d="M44 320 L96 320 M50 340 Q70 326 90 346" stroke="#3b6fd4" strokeWidth="3" fill="none" strokeLinecap="round" />

      <path d="M0 470 L390 470" stroke="#3c4440" strokeWidth="5" />
      <Tiles y={470} color="#2a2f2c" line="#323834" size={62} />

      <path d="M0 520 L120 520 L120 536 L0 536 Z" fill="#8a8a82" />
      <path d="M12 536 L12 610 M108 536 L108 610" stroke="#6a6a64" strokeWidth="7" />
      <path d="M30 520 Q30 492 44 492 L44 470 L58 470 L58 492 Q74 496 76 516 Z" fill="#9b7ad6" opacity="0.85" />
      <path d="M88 474 L98 474 L98 496 L108 518 L78 518 L88 496 Z" fill="#5fd3e0" opacity="0.7" />
      <g fill="#8ad15b">
        <circle className={styles.bubble} cx="50" cy="480" r="4" />
        <circle className={styles.bubble} style={delay(-0.6)} cx="58" cy="486" r="3" />
        <circle className={styles.bubble} style={delay(-1.2)} cx="44" cy="488" r="2.6" />
        <circle className={styles.bubble} style={delay(-0.3)} cx="94" cy="480" r="2.8" />
      </g>

      <path d="M270 560 L390 560 L390 576 L270 576 Z" fill="#8a8a82" />
      <path d="M282 576 L282 650" stroke="#6a6a64" strokeWidth="7" />
      <g transform="translate(296 504)">
        <path d="M0 0 L70 0 L70 46 L0 46 Z" fill="#3a3a38" />
        <path d="M5 5 L65 5 L65 41 L5 41 Z" className={styles.screen} fill="#1d3a2a" />
        <path d="M12 14 L40 14 M12 23 L52 23 M12 32 L32 32" stroke="#8ad15b" strokeWidth="3" strokeLinecap="round" />
        <path d="M-8 46 L78 46 L84 56 L-14 56 Z" fill="#555550" />
      </g>
    </>
  );
}

function Office() {
  const lit: [number, number][] = [
    [62, 160], [70, 196], [118, 120], [126, 170], [118, 214], [196, 140], [210, 182], [262, 100], [270, 150], [322, 132], [330, 188], [176, 230],
  ];
  return (
    <>
      <rect width="390" height="844" fill="#232833" />
      <path d="M30 40 L360 40 L360 300 L30 300 Z" fill="#1a2440" stroke="#4a5266" strokeWidth="8" />
      <path d="M140 40 L140 300 M250 40 L250 300" stroke="#4a5266" strokeWidth="6" />
      <g fill="#2f3f66">
        <path d="M44 300 L44 150 L84 150 L84 300 Z" />
        <path d="M100 300 L100 104 L140 104 L140 300 Z" />
        <path d="M160 300 L160 130 L224 130 L224 300 Z" />
        <path d="M250 300 L250 86 L290 86 L290 300 Z" />
        <path d="M306 300 L306 118 L350 118 L350 300 Z" />
      </g>
      <g fill="#ede06a">
        {lit.map(([x, y], i) => (
          <rect key={i} className={styles.window} style={delay((i * 0.37) % 2.4)} x={x} y={y} width="8" height="10" />
        ))}
      </g>
      <path d="M30 300 L360 300" stroke="#5a6278" strokeWidth="10" strokeLinecap="round" />

      <path d="M0 470 L390 470" stroke="#3c4250" strokeWidth="5" />
      <rect y="470" width="390" height="374" fill="#2c303a" />
      <g fill="#30343f">
        {Array.from({ length: 8 }, (_, r) =>
          Array.from({ length: 8 }, (_, c) => ((r + c) % 2 ? <rect key={`${r}-${c}`} x={c * 52} y={470 + r * 52} width="52" height="52" /> : null)),
        )}
      </g>

      <defs>
        <clipPath id="backdrop-printer-slot">
          <rect x="16" y="380" width="110" height="64" />
        </clipPath>
      </defs>
      <g clipPath="url(#backdrop-printer-slot)">
        <g className={styles.paper}>
          <path d="M44 410 L98 410 L98 450 L44 450 Z" fill="#f2f2ec" />
          <path d="M52 420 L90 420 M52 428 L82 428 M52 436 L86 436" stroke="#9a9a92" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      </g>
      <path d="M14 450 Q14 444 20 444 L122 444 Q128 444 128 450 L128 540 L14 540 Z" fill="#c8c8c0" />
      <path d="M36 444 L106 444 L106 452 L36 452 Z" fill="#3a3a38" />
      <path d="M28 468 L114 468 L114 490 L28 490 Z" fill="#a8a8a0" />
      <path d="M30 506 L112 506 L112 520 L30 520 Z" fill="#b8b8b0" />
      <circle className={styles.led} cx="114" cy="458" r="3.4" fill="#8ad15b" />

      <path d="M326 520 L370 520 L370 600 L326 600 Z" fill="#e8e4d2" />
      <path d="M328 462 Q328 448 348 448 Q368 448 368 462 L368 518 L328 518 Z" fill="#5fd3e0" opacity="0.6" />
      <circle className={styles.bubble} cx="342" cy="504" r="4" fill="#f2f2ec" />
      <circle className={styles.bubble} style={delay(-0.9)} cx="354" cy="508" r="3" fill="#f2f2ec" />
    </>
  );
}

function DataCenter() {
  return (
    <>
      <rect width="390" height="844" fill="#121a2a" />
      <path d="M130 0 L260 0 L250 18 L140 18 Z" fill="#5fd3e0" opacity="0.16" />
      {[0, 1, 2, 3].map((r) => {
        const x = r < 2 ? 6 + r * 62 : 268 + (r - 2) * 62 - 0;
        return (
          <g key={r} transform={`translate(${x} 40)`}>
            <path d="M0 0 L56 0 L56 440 L0 440 Z" fill="#1c2a44" stroke="#2f4470" strokeWidth="3" />
            {Array.from({ length: 22 }, (_, u) => (
              <g key={u} transform={`translate(6 ${8 + u * 19.6})`}>
                <path d="M0 0 L44 0 L44 14 L0 14 Z" fill="#26375a" />
                <path d="M6 7 L24 7" stroke="#3b4f7a" strokeWidth="2.5" strokeLinecap="round" />
                <circle className={styles.led} style={delay(((r * 22 + u) * 0.23) % 1.6)} cx="37" cy="7" r="2.6" fill={(r + u) % 3 === 0 ? "#5fd3e0" : "#8ad15b"} />
              </g>
            ))}
          </g>
        );
      })}
      <g transform="translate(195 150)">
        <path d="M-56 -60 L56 -60 L56 60 L-56 60 Z" fill="#1c2a44" stroke="#2f4470" strokeWidth="4" />
        <circle r="46" fill="#162238" stroke="#3b4f7a" strokeWidth="4" />
        <g className={styles.fan}>
          {[0, 1, 2, 3, 4].map((b) => (
            <path key={b} transform={`rotate(${b * 72})`} d="M0 0 Q9 -20 3 -40 Q-14 -29 -9 -6 Z" fill="#4a6aa8" />
          ))}
        </g>
        <circle r="7" fill="#6f8fe0" />
      </g>
      <rect y="480" width="390" height="364" fill="#162238" />
      <g stroke="#22314f" strokeWidth="3">
        <path d="M0 480 L390 480" />
        {Array.from({ length: 7 }, (_, r) => (
          <path key={r} d={`M0 ${530 + r * 52} L390 ${530 + r * 52}`} />
        ))}
        {[0, 65, 130, 195, 260, 325, 390].map((x) => (
          <path key={x} d={`M${x} 480 L${195 + (x - 195) * 1.6} 844`} />
        ))}
      </g>
      <path d="M150 480 L240 480 L290 844 L100 844 Z" fill="#5fd3e0" opacity="0.04" />
    </>
  );
}

function Cloud() {
  return (
    <>
      <defs>
        <linearGradient id="backdrop-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b1530" />
          <stop offset="0.6" stopColor="#231c3d" />
          <stop offset="1" stopColor="#141226" />
        </linearGradient>
      </defs>
      <rect width="390" height="844" fill="url(#backdrop-sky)" />
      <g fill="#f2f2ec">
        {[
          [40, 80], [120, 40], [300, 70], [350, 160], [80, 210], [220, 120], [260, 260], [30, 340], [180, 380], [340, 330], [110, 470], [300, 430],
        ].map(([x, y], i) => (
          <circle key={i} className={styles.twinkle} style={delay(-(i * 0.53) % 3)} cx={x} cy={y} r={i % 3 ? 1.6 : 2.4} />
        ))}
      </g>
      {[
        { y: 150, s: 1.3, d: 0 },
        { y: 330, s: 1, d: -14 },
        { y: 520, s: 1.5, d: -7 },
        { y: 690, s: 1.1, d: -21 },
      ].map((c, i) => (
        <g key={i} className={styles.drift} style={delay(c.d)}>
          <g transform={`translate(0 ${c.y}) scale(${c.s})`}>
            <path d="M0 30 Q0 10 22 10 Q30 -8 52 -2 Q70 -14 86 4 Q108 4 108 24 Q110 40 90 40 L14 40 Q0 40 0 30 Z" fill="#4a3d7a" opacity="0.85" />
          </g>
        </g>
      ))}
    </>
  );
}

export function ZoneBackdrop({ layout, endless }: { layout: LayoutId; endless?: boolean }) {
  return (
    <div className={styles.backdrop} aria-hidden="true">
      <svg className={styles.art} viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
        {endless ? (
          <Cloud />
        ) : (
          <>
            {layout === "home" && <Home />}
            {layout === "cafe" && <Cafe />}
            {layout === "school" && <School />}
            {layout === "office" && <Office />}
            {layout === "datacenter" && <DataCenter />}
          </>
        )}
      </svg>
      <div className={styles.shade} />
    </div>
  );
}
