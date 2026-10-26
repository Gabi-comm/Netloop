import styles from "./bitHappy.module.css";

const SPARKS = [
  { x: 12, y: 30, d: 0, c: "var(--points)" },
  { x: 88, y: 26, d: 120, c: "var(--data)" },
  { x: 6, y: 62, d: 240, c: "var(--pink)" },
  { x: 94, y: 60, d: 60, c: "var(--legit)" },
  { x: 50, y: -4, d: 180, c: "var(--points)" },
];

export function BitHappy({ size = 120 }: { size?: number }) {
  return (
    <svg className={styles.bit} width={size} height={size * 1.1} viewBox="0 -6 100 110" role="img" aria-label="Bit cheering">
      <ellipse className={styles.shadow} cx="50" cy="94" rx="28" ry="4" />
      {SPARKS.map((s, i) => (
        <g key={i} className={styles.spark} style={{ animationDelay: `${1100 + s.d}ms`, transformOrigin: `${s.x}px ${s.y}px` }}>
          <path d={`M${s.x} ${s.y - 6} L${s.x} ${s.y + 6} M${s.x - 6} ${s.y} L${s.x + 6} ${s.y}`} stroke={s.c} />
        </g>
      ))}
      <g className={styles.hop}>
        <g className={styles.body}>
          <path className={styles.legs} d="M34 78 L30 88 M46 78 L44 90 M56 78 L58 90 M68 77 L72 88" />
          <g className={styles.antennaLeft}>
            <path className={styles.stick} d="M38 22 L32 8" />
            <circle className={`${styles.led} ${styles.ledPink}`} cx="32" cy="8" r="4.5" />
          </g>
          <g className={styles.antennaRight}>
            <path className={styles.stick} d="M62 21 L70 7" />
            <circle className={`${styles.led} ${styles.ledCyan}`} cx="70" cy="7" r="4.5" />
          </g>
          <path className={styles.shell} d="M22 40 Q20 24 36 22 L66 21 Q80 22 80 38 L81 62 Q80 76 64 77 L36 78 Q21 77 21 62 Z" />
          <path className={styles.eyes} d="M37 48 Q41.5 41 46 48 M55 48 Q59.5 41 64 48" />
          <path className={styles.smile} d="M42 55 Q51 66 60 55 Z" />
          <circle className={styles.cheek} cx="33" cy="57" r="3.5" />
          <circle className={styles.cheek} cx="69" cy="57" r="3.5" />
          <circle className={`${styles.light} ${styles.light1}`} cx="40" cy="69" r="2.6" />
          <circle className={`${styles.light} ${styles.light2}`} cx="50" cy="69" r="2.6" />
          <circle className={`${styles.light} ${styles.light3}`} cx="60" cy="69" r="2.6" />
        </g>
      </g>
    </svg>
  );
}
