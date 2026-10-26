import styles from "./bitShutdown.module.css";

export function BitShutdown({ size = 120 }: { size?: number }) {
  return (
    <svg className={styles.bit} width={size} height={size * 1.1} viewBox="0 -6 100 110" role="img" aria-label="Bit shutting down">
      <ellipse className={styles.shadow} cx="50" cy="94" rx="30" ry="4" />
      <path className={styles.legs} d="M34 78 L32 90 M48 78 L48 90 M60 78 L62 90 M70 76 L74 88" />
      <g className={styles.body}>
        <g className={styles.antennaLeft}>
          <path className={styles.stick} d="M38 22 L32 8" />
          <circle className={`${styles.led} ${styles.ledPink}`} cx="32" cy="8" r="4.5" />
        </g>
        <g className={styles.antennaRight}>
          <path className={styles.stick} d="M62 21 L70 7" />
          <circle className={`${styles.led} ${styles.ledCyan}`} cx="70" cy="7" r="4.5" />
        </g>
        <path className={styles.shell} d="M22 40 Q20 24 36 22 L66 21 Q80 22 80 38 L81 62 Q80 76 64 77 L36 78 Q21 77 21 62 Z" />
        <g className={styles.eyesOpen}>
          <circle cx="42" cy="46" r="3.6" />
          <circle cx="60" cy="46" r="3.6" />
        </g>
        <path className={styles.eyesClosed} d="M38 47 L46 47 M56 47 L64 47" />
        <path className={styles.frown} d="M46 59 Q51 55 56 59" />
        <path className={styles.flat} d="M46 59 L56 59" />
        <circle className={`${styles.light} ${styles.light1}`} cx="40" cy="68" r="2.6" />
        <circle className={`${styles.light} ${styles.light2}`} cx="50" cy="68" r="2.6" />
        <circle className={`${styles.light} ${styles.light3}`} cx="60" cy="68" r="2.6" />
        <rect className={styles.scan} x="21" y="21" width="60" height="57" rx="14" />
      </g>
    </svg>
  );
}
