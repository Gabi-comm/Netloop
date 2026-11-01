import type { LayoutId } from "@/game/network";
import styles from "./zones.module.css";

const INK = "#121212";

function Home() {
  return (
    <>
      <rect width="360" height="180" fill="#2b2420" />
      <path d="M0 0 L360 0 L360 18 L0 18 Z" fill="#241e1b" />
      <rect y="128" width="360" height="52" fill="#4a3426" />
      <path d="M0 128 L360 128" stroke="#5c4130" strokeWidth="3" />
      <path d="M40 146 L120 146 M150 160 L250 160 M280 144 L340 144" stroke="#5c4130" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M150 30 Q150 26 154 26 L222 26 Q226 26 226 30 L226 72 Q226 76 222 76 L154 76 Q150 76 150 72 Z" fill="#3a302a" stroke="#6b5646" strokeWidth="3" />
      <path d="M156 70 L178 46 L192 60 L204 50 L220 70 Z" fill="#4f6b5a" />
      <circle cx="208" cy="38" r="5" fill="#ede06a" opacity="0.7" />

      <g className={styles.lampGlow}>
        <ellipse cx="298" cy="80" rx="64" ry="58" fill="#ede06a" opacity="0.08" />
        <ellipse cx="298" cy="70" rx="34" ry="30" fill="#ede06a" opacity="0.08" />
      </g>
      <path d="M298 64 L298 150 M286 150 L310 150" stroke="#8a7a5a" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M282 64 L314 64 L306 40 L290 40 Z" fill="#f3d36b" />

      <ellipse cx="230" cy="158" rx="56" ry="10" fill="#3c5f63" opacity="0.8" />
      <path d="M198 150 Q194 108 210 104 L254 104 Q268 106 266 150 Z" fill="#d49a3a" />
      <path d="M190 120 Q190 112 200 112 L206 112 L206 152 L192 152 Z M256 112 L264 112 Q274 112 274 120 L274 152 L256 152 Z" fill="#c4862c" />
      <path d="M210 128 L254 128 L254 150 L210 150 Z" fill="#e2ad4f" />
      <path d="M222 112 Q232 104 244 112 L240 126 L226 126 Z" fill="#8ad15b" opacity="0.8" />

      <path d="M120 150 L120 116 L156 116 L156 150" fill="none" stroke="#6b4a33" strokeWidth="4" />
      <path d="M116 116 L160 116" stroke="#7a5638" strokeWidth="5" strokeLinecap="round" />
      <path d="M126 104 L150 104 Q154 104 154 108 L154 114 L122 114 L122 108 Q122 104 126 104 Z" fill="#f2f2ec" />
      <path d="M130 104 L126 94 M146 104 L150 94" stroke="#f2f2ec" strokeWidth="2.5" strokeLinecap="round" />
      <circle className={styles.led} cx="132" cy="109" r="2" fill="#8ad15b" />
      <circle className={styles.led} style={{ animationDelay: "0.3s" }} cx="140" cy="109" r="2" fill="#5fd3e0" />

      <g transform="translate(300 152)">
        <ellipse cx="0" cy="0" rx="20" ry="8" fill="#c98f2a" />
        <circle cx="16" cy="-6" r="7" fill="#c98f2a" />
        <path d="M12 -12 L14 -18 L18 -12" fill="#a8741f" />
        <path d="M14 -5 Q16 -3 18 -5" stroke={INK} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path className={styles.tail} d="M-18 -2 Q-28 -10 -24 -16" stroke="#c98f2a" strokeWidth="4" fill="none" strokeLinecap="round" />
      </g>
      <path d="M40 128 L44 102 L60 102 L64 128 Z" fill="#7a5638" />
      <path d="M52 102 Q40 84 46 76 M52 102 Q52 80 58 72 M52 102 Q64 86 66 80" stroke="#6fb043" strokeWidth="4" fill="none" strokeLinecap="round" />
    </>
  );
}

function Cafe() {
  return (
    <>
      <rect width="360" height="180" fill="#2e2219" />
      <path d="M0 0 L360 0 L360 90 L0 90 Z" fill="#33261c" />
      <g stroke="#3e2e22" strokeWidth="2">
        {[0, 1, 2, 3, 4, 5].map((r) => (
          <path key={r} d={`M0 ${14 + r * 13} L360 ${14 + r * 13}`} />
        ))}
      </g>
      <path d="M200 16 L262 16 L262 66 L200 66 Z" fill="#1f2a24" stroke="#7a5638" strokeWidth="4" />
      <path d="M212 28 L244 28 M212 38 L250 38 M212 48 L236 48 M212 58 L246 58" stroke="#f2f2ec" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <g className={styles.swing}>
        <path d="M300 0 L300 24" stroke="#555" strokeWidth="2" />
        <path d="M288 34 L312 34 L306 24 L294 24 Z" fill="#3a3a38" />
        <ellipse cx="300" cy="40" rx="22" ry="14" fill="#ede06a" opacity="0.15" />
      </g>
      <g className={styles.swing} style={{ animationDelay: "-1.2s" }}>
        <path d="M150 0 L150 20" stroke="#555" strokeWidth="2" />
        <path d="M138 30 L162 30 L156 20 L144 20 Z" fill="#3a3a38" />
        <ellipse cx="150" cy="36" rx="22" ry="14" fill="#ede06a" opacity="0.15" />
      </g>
      <rect y="112" width="360" height="68" fill="#3d2a1d" />
      <path d="M0 112 L360 112" stroke="#6b4a33" strokeWidth="4" />
      <path d="M0 100 L170 100 L170 140 L0 140 Z" fill="#7a5638" />
      <path d="M0 100 L170 100" stroke="#9a6e48" strokeWidth="4" />
      <path d="M20 66 L80 66 L80 100 L20 100 Z" fill="#b8b8b0" />
      <path d="M26 72 L74 72 L74 84 L26 84 Z" fill="#8a8a82" />
      <path d="M40 84 L40 92 M60 84 L60 92" stroke="#555" strokeWidth="4" strokeLinecap="round" />
      <path d="M36 94 L44 94 L43 100 L37 100 Z M56 94 L64 94 L63 100 L57 100 Z" fill="#f2f2ec" />
      <path className={styles.steam} d="M50 62 Q44 52 50 44 Q56 36 50 26" stroke="#f2f2ec" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path className={styles.steam} style={{ animationDelay: "-1s" }} d="M62 62 Q56 54 62 46 Q68 38 62 30" stroke="#f2f2ec" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M100 86 L114 86 L112 100 L102 100 Z M122 90 L136 90 L134 100 L124 100 Z" fill="#f2f2ec" />
      <g>
        <ellipse cx="250" cy="130" rx="34" ry="6" fill="#9a6e48" />
        <path d="M250 136 L250 166 M236 168 L264 168" stroke="#6b4a33" strokeWidth="4" strokeLinecap="round" />
        <path d="M244 118 L256 118 L255 128 L245 128 Z" fill="#f2f2ec" />
        <path className={styles.steam} style={{ animationDelay: "-0.5s" }} d="M250 114 Q246 106 250 100 Q254 94 250 88" stroke="#f2f2ec" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>
      <g fill="#c4862c">
        <ellipse cx="200" cy="148" rx="12" ry="4" />
        <ellipse cx="310" cy="152" rx="12" ry="4" />
      </g>
      <path d="M200 152 L200 172 M310 156 L310 174" stroke="#6b4a33" strokeWidth="3.5" />
    </>
  );
}

function School() {
  return (
    <>
      <rect width="360" height="180" fill="#1f2b27" />
      <path d="M30 18 L94 18 L94 64 L30 64 Z" fill="#e8e4d2" opacity="0.85" />
      <path d="M40 30 L84 30 M40 40 L74 40 M48 50 Q60 42 72 54" stroke="#3b6fd4" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M120 10 L200 10 L200 58 L120 58 Z" fill="#2c4a3e" stroke="#5c4130" strokeWidth="4" />
      <path d="M132 26 L170 26 M132 38 Q150 30 168 44 M176 22 L186 34" stroke="#f2f2ec" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />
      <rect y="104" width="360" height="76" fill="#2a2f2c" />
      <path d="M0 104 L360 104" stroke="#3c4440" strokeWidth="3" />
      <path d="M150 96 L350 96 L350 106 L150 106 Z" fill="#8a8a82" />
      <path d="M160 106 L160 150 M340 106 L340 150" stroke="#6a6a64" strokeWidth="5" />
      {[0, 1].map((i) => (
        <g key={i} transform={`translate(${190 + i * 90} 62)`}>
          <path d="M0 0 L50 0 L50 32 L0 32 Z" fill="#3a3a38" />
          <path d="M4 4 L46 4 L46 28 L4 28 Z" fill="#1d3a2a" className={styles.screen} style={{ animationDelay: `${i * 0.7}s` }} />
          <path d="M8 10 L30 10 M8 16 L38 16 M8 22 L24 22" stroke="#8ad15b" strokeWidth="2" strokeLinecap="round" />
          <path d="M-6 32 L56 32 L60 36 L-10 36 Z" fill="#555550" />
        </g>
      ))}
      <path d="M40 140 L130 140 L130 150 L40 150 Z" fill="#6a6a64" />
      <path d="M60 104 L66 140 M110 104 L104 140" stroke="#555" strokeWidth="3" />
      <path d="M64 96 Q64 84 70 84 L70 72 L80 72 L80 84 Q88 86 90 96 Q92 108 78 110 Q62 110 64 96 Z" fill="#9b7ad6" opacity="0.85" />
      <path d="M100 74 L108 74 L108 90 L116 108 L92 108 L100 90 Z" fill="#5fd3e0" opacity="0.7" />
      <g fill="#8ad15b">
        <circle className={styles.bubble} cx="76" cy="66" r="3" />
        <circle className={styles.bubble} style={{ animationDelay: "-0.6s" }} cx="82" cy="70" r="2.4" />
        <circle className={styles.bubble} style={{ animationDelay: "-1.2s" }} cx="72" cy="72" r="2" />
        <circle className={styles.bubble} style={{ animationDelay: "-0.3s" }} cx="104" cy="68" r="2.2" />
      </g>
      <path d="M300 34 L344 34 L344 60 L300 60 Z" fill="#e8e4d2" opacity="0.6" />
      <path d="M310 44 L334 44 M310 52 L326 52" stroke={INK} strokeWidth="2" strokeLinecap="round" />
    </>
  );
}

function Office() {
  return (
    <>
      <rect width="360" height="180" fill="#232833" />
      <path d="M150 10 L350 10 L350 96 L150 96 Z" fill="#1a2440" stroke="#4a5266" strokeWidth="4" />
      <path d="M216 10 L216 96 M283 10 L283 96" stroke="#4a5266" strokeWidth="3" />
      <g fill="#2f3f66">
        <path d="M160 96 L160 50 L180 50 L180 96 Z" />
        <path d="M186 96 L186 34 L206 34 L206 96 Z" />
        <path d="M224 96 L224 44 L248 44 L248 96 Z" />
        <path d="M254 96 L254 26 L274 26 L274 96 Z" />
        <path d="M292 96 L292 40 L314 40 L314 96 Z" />
        <path d="M320 96 L320 56 L342 56 L342 96 Z" />
      </g>
      <g fill="#ede06a">
        {[
          [166, 58], [172, 70], [192, 42], [198, 60], [192, 76], [230, 52], [240, 66], [260, 34], [264, 54], [298, 48], [306, 66], [326, 64],
        ].map(([x, y], i) => (
          <rect key={i} className={styles.window} style={{ animationDelay: `${(i * 0.37) % 2.4}s` }} x={x} y={y} width="4" height="5" />
        ))}
      </g>
      <rect y="116" width="360" height="64" fill="#2c303a" />
      <path d="M0 116 L360 116" stroke="#3c4250" strokeWidth="3" />
      <path d="M200 70 L290 70 L290 150 L200 150 Z" fill="#c9b38a" />
      <path d="M206 76 L284 76 L284 112 L206 112 Z" fill="#b39f78" />
      <path d="M214 84 L228 84 L228 94 L214 94 Z M240 82 L252 82 L252 92 L240 92 Z" fill="#ede06a" opacity="0.8" />
      <defs>
        <clipPath id="office-printer-slot">
          <rect x="30" y="60" width="60" height="44" />
        </clipPath>
      </defs>
      <g clipPath="url(#office-printer-slot)">
        <g className={styles.paper}>
          <path d="M44 82 L76 82 L76 106 L44 106 Z" fill="#f2f2ec" />
          <path d="M49 89 L71 89 M49 94 L66 94 M49 99 L69 99" stroke="#9a9a92" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      </g>
      <path d="M28 104 Q28 100 32 100 L88 100 Q92 100 92 104 L92 150 L28 150 Z" fill="#c8c8c0" />
      <path d="M40 100 L80 100 L80 105 L40 105 Z" fill="#3a3a38" />
      <path d="M36 114 L84 114 L84 126 L36 126 Z" fill="#a8a8a0" />
      <path d="M38 134 L82 134 L82 142 L38 142 Z" fill="#b8b8b0" />
      <circle className={styles.led} cx="82" cy="108" r="2.2" fill="#8ad15b" />
      <path d="M118 108 L144 108 L144 150 L118 150 Z" fill="#e8e4d2" />
      <path d="M120 78 Q120 70 131 70 Q142 70 142 78 L142 106 L120 106 Z" fill="#5fd3e0" opacity="0.6" />
      <circle className={styles.bubble} cx="128" cy="98" r="2.6" fill="#f2f2ec" />
      <circle className={styles.bubble} style={{ animationDelay: "-0.9s" }} cx="134" cy="100" r="2" fill="#f2f2ec" />
    </>
  );
}

function DataCenter() {
  return (
    <>
      <rect width="360" height="180" fill="#121a2a" />
      <path d="M0 120 L360 120 L360 180 L0 180 Z" fill="#162238" />
      <path d="M0 120 L360 120 M60 120 L20 180 M140 120 L120 180 M220 120 L240 180 M300 120 L340 180" stroke="#22314f" strokeWidth="2" />
      <path d="M120 0 L240 0 L230 12 L130 12 Z" fill="#5fd3e0" opacity="0.15" />
      {[0, 1, 2, 3].map((r) => (
        <g key={r} transform={`translate(${20 + r * 62} 22)`}>
          <path d="M0 0 L50 0 L50 104 L0 104 Z" fill="#1c2a44" stroke="#2f4470" strokeWidth="2.5" />
          {[0, 1, 2, 3, 4, 5, 6].map((u) => (
            <g key={u} transform={`translate(5 ${6 + u * 14})`}>
              <path d="M0 0 L40 0 L40 10 L0 10 Z" fill="#26375a" />
              <circle className={styles.led} style={{ animationDelay: `${((r * 7 + u) * 0.23) % 1.6}s` }} cx="34" cy="5" r="2" fill={(r + u) % 3 === 0 ? "#5fd3e0" : "#8ad15b"} />
              <path d="M5 5 L22 5" stroke="#3b4f7a" strokeWidth="2" strokeLinecap="round" />
            </g>
          ))}
        </g>
      ))}
      <g transform="translate(312 70)">
        <path d="M-40 -48 L40 -48 L40 48 L-40 48 Z" fill="#1c2a44" stroke="#2f4470" strokeWidth="3" />
        <circle r="32" fill="#162238" stroke="#3b4f7a" strokeWidth="3" />
        <g className={styles.fan}>
          {[0, 1, 2, 3, 4].map((b) => (
            <path key={b} transform={`rotate(${b * 72})`} d="M0 0 Q6 -14 2 -28 Q-10 -20 -6 -4 Z" fill="#4a6aa8" />
          ))}
        </g>
        <circle r="5" fill="#6f8fe0" />
      </g>
    </>
  );
}

export function ZoneScene({ layout }: { layout: LayoutId }) {
  return (
    <svg aria-hidden="true" className={styles.sceneArt} viewBox="0 0 360 180" preserveAspectRatio="xMidYMid slice">
      {layout === "home" && <Home />}
      {layout === "cafe" && <Cafe />}
      {layout === "school" && <School />}
      {layout === "office" && <Office />}
      {layout === "datacenter" && <DataCenter />}
    </svg>
  );
}

export function ZoneBadge({ layout }: { layout: LayoutId }) {
  return (
    <svg aria-hidden="true" className={styles.badgeArt} viewBox="0 0 60 60">
      {layout === "home" && (
        <>
          <path d="M12 30 Q12 26 16 26 L44 26 Q48 26 48 30 L48 40 Q48 44 44 44 L16 44 Q12 44 12 40 Z" fill="#f2f2ec" />
          <path d="M20 26 L16 14 M40 26 L44 14" stroke="#f2f2ec" strokeWidth="3" strokeLinecap="round" />
          <circle cx="22" cy="35" r="2.5" fill="#8ad15b" />
          <circle cx="30" cy="35" r="2.5" fill="#5fd3e0" />
          <circle cx="38" cy="35" r="2.5" fill="#e0567f" />
        </>
      )}
      {layout === "cafe" && (
        <>
          <path d="M14 12 L46 12 L46 46 L14 46 Z" fill="#1f2a24" stroke="#9a6e48" strokeWidth="3.5" />
          <path d="M20 22 L40 22 M20 30 L36 30 M20 38 L38 38" stroke="#f2f2ec" strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}
      {layout === "school" && (
        <>
          <path d="M14 16 L46 16 L46 38 L14 38 Z" fill="#3a3a38" />
          <path d="M17 19 L43 19 L43 35 L17 35 Z" fill="#1d3a2a" />
          <path d="M21 24 L35 24 M21 30 L39 30" stroke="#8ad15b" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M8 38 L52 38 L54 44 L6 44 Z" fill="#8a8a82" />
        </>
      )}
      {layout === "office" && (
        <>
          <path d="M18 8 L42 8 L42 52 L18 52 Z" fill="#c9b38a" />
          <path d="M22 12 L38 12 L38 48 L22 48 Z" fill="#b39f78" />
          <circle cx="35" cy="31" r="2.5" fill="#121212" />
        </>
      )}
      {layout === "datacenter" && (
        <>
          <path d="M16 8 L44 8 L44 52 L16 52 Z" fill="#1c2a44" stroke="#3b4f7a" strokeWidth="2.5" />
          {[0, 1, 2, 3].map((u) => (
            <g key={u}>
              <path d={`M20 ${13 + u * 10} L40 ${13 + u * 10} L40 ${20 + u * 10} L20 ${20 + u * 10} Z`} fill="#26375a" />
              <circle cx="36" cy={16.5 + u * 10} r="1.8" fill={u % 2 ? "#5fd3e0" : "#8ad15b"} />
            </g>
          ))}
        </>
      )}
    </svg>
  );
}
