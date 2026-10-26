import styles from "./home.module.css";

const malware = "M18 60 Q14 34 38 28 Q48 18 60 26 Q84 26 82 54 Q86 78 58 80 Q30 86 18 60 Z";

function Malware({ x, y, scale, delay }: { x: number; y: number; scale: number; delay: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g className={styles.wobble} style={{ animationDelay: delay }}>
        <path d={malware} fill="#e8553d" />
        <circle cx="40" cy="52" r="3.6" fill="#121212" />
        <circle cx="62" cy="52" r="3.6" fill="#121212" />
        <path d="M32 41 L46 46 M70 41 L56 46 M40 66 L45 62 L50 66 L55 62 L60 66" stroke="#121212" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M32 80 L30 90 M66 80 L68 90" stroke="#e8553d" strokeWidth="5" strokeLinecap="round" />
      </g>
    </g>
  );
}

export function HeroScene() {
  return (
    <svg
      role="img"
      aria-label="Bit, a little white router creature, has drawn a loop around two angry red malware blobs while a happy green packet walks past and the blue server sits on its cloud"
      viewBox="0 0 342 228"
      className={styles.hero}
    >
      <path d="M196 228 Q192 186 232 178 Q262 158 300 168 Q342 168 342 204 L342 228 Z" fill="#3b6fd4" />
      <g transform="translate(246 116) scale(0.86)">
        <path d="M24 18 Q24 12 32 12 L70 12 Q78 12 78 20 L78 84 Q78 90 70 90 L32 90 Q24 90 24 84 Z" fill="#6f8fe0" />
        <path d="M32 34 L70 34 M32 52 L70 52 M32 70 L70 70" stroke="#2f4f9f" strokeWidth="4" strokeLinecap="round" />
        <path d="M38 25 Q42 21 46 25 M56 25 Q60 21 64 25" stroke="#121212" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle className={styles.blink} cx="64" cy="43" r="3.2" fill="#8ad15b" />
        <circle className={styles.blink} style={{ animationDelay: "0.4s" }} cx="64" cy="61" r="3.2" fill="#8ad15b" />
        <circle className={styles.blink} style={{ animationDelay: "0.8s" }} cx="64" cy="79" r="3.2" fill="#8ad15b" />
      </g>
      <path
        className={styles.loop}
        pathLength={100}
        d="M84 104 Q76 52 134 44 Q198 34 214 86 Q228 140 170 156 Q98 172 84 108 Q82 96 90 84"
        fill="none"
        stroke="#f2f2ec"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <Malware x={104} y={62} scale={0.52} delay="0s" />
      <Malware x={146} y={90} scale={0.5} delay="0.35s" />
      <g transform="translate(246 6) scale(0.5)">
        <g className={styles.walk}>
          <path d="M20 56 Q18 30 46 26 Q76 22 80 50 Q83 74 56 78 Q24 82 20 56 Z" fill="#8ad15b" />
          <path d="M38 50 Q42 45 46 50 M56 49 Q60 44 64 49" stroke="#121212" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M32 80 L30 90 M66 79 L68 89" stroke="#8ad15b" strokeWidth="5" strokeLinecap="round" />
        </g>
      </g>
      <g transform="translate(4 120)">
        <g className={styles.bob}>
          <path d="M38 22 L32 8 M62 21 L70 7" stroke="#f2f2ec" strokeWidth="4" strokeLinecap="round" />
          <circle cx="32" cy="8" r="4.5" fill="#e0567f" />
          <circle cx="70" cy="7" r="4.5" fill="#5fd3e0" />
          <path d="M22 40 Q20 24 36 22 L66 21 Q80 22 80 38 L81 62 Q80 76 64 77 L36 78 Q21 77 21 62 Z" fill="#f2f2ec" />
          <g className={styles.eyes}>
            <circle cx="42" cy="46" r="3.6" fill="#121212" />
            <circle cx="60" cy="46" r="3.6" fill="#121212" />
          </g>
          <path d="M46 57 Q51 61 56 57" stroke="#121212" strokeWidth="3" fill="none" strokeLinecap="round" />
          <circle className={styles.chase} cx="40" cy="68" r="2.6" fill="#5fd3e0" />
          <circle className={styles.chase} style={{ animationDelay: "0.2s" }} cx="50" cy="68" r="2.6" fill="#5fd3e0" />
          <circle className={styles.chase} style={{ animationDelay: "0.4s" }} cx="60" cy="68" r="2.6" fill="#5fd3e0" />
          <path d="M34 78 L32 90 M48 78 L48 90 M60 78 L62 90 M70 76 L74 88" stroke="#f2f2ec" strokeWidth="4" strokeLinecap="round" />
        </g>
      </g>
      <g fill="#ede06a" className={styles.sparkle}>
        <circle cx="40" cy="30" r="5" />
        <circle cx="54" cy="22" r="4" />
        <circle cx="58" cy="36" r="4.5" />
      </g>
    </svg>
  );
}
