type IconProps = { size?: number; color?: string; className?: string };

export function GearIcon({ size = 26, color = "var(--chalk)" }: IconProps) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 26 26" fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round">
      <circle cx="13" cy="13" r="5" />
      <path d="M13 2 V6 M13 20 V24 M2 13 H6 M20 13 H24 M5 5 L8 8 M18 18 L21 21 M21 5 L18 8 M5 21 L8 18" />
    </svg>
  );
}

export function DataIcon({ size = 20, color = "var(--data)" }: IconProps) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20">
      <path d="M10 2 L17 10 L10 18 L3 10 Z" fill={color} />
    </svg>
  );
}

export function ZonesIcon({ size = 32, color = "var(--data)" }: IconProps) {
  return (
    <svg aria-hidden="true" width={size} height={(size * 30) / 32} viewBox="0 0 32 30" fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="22" r="4" />
      <circle cx="25" cy="22" r="4" />
      <circle cx="16" cy="7" r="4" />
      <path d="M10 19 L14 10 M22 19 L18 10 M11 22 L21 22" />
    </svg>
  );
}

export function CodexIcon({ size = 32, color = "var(--points)" }: IconProps) {
  return (
    <svg aria-hidden="true" width={size} height={(size * 30) / 32} viewBox="0 0 32 30" fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 7 Q10 3 3 5 L3 25 Q10 23 16 27 Q22 23 29 25 L29 5 Q22 3 16 7 Z M16 7 L16 27" />
    </svg>
  );
}

export function ShopIcon({ size = 32, color = "var(--pink)" }: IconProps) {
  return (
    <svg aria-hidden="true" width={size} height={(size * 30) / 32} viewBox="0 0 32 30" fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 10 L27 10 L25 27 L7 27 Z M11 10 Q11 3 16 3 Q21 3 21 10" />
    </svg>
  );
}

export function PlayIcon({ size = 26, color = "var(--ground)" }: IconProps) {
  return (
    <svg aria-hidden="true" width={size} height={(size * 28) / 26} viewBox="0 0 26 28">
      <path d="M4 3 Q3 1 6 2 L23 12 Q26 14 23 16 L6 26 Q3 27 4 24 Z" fill={color} />
    </svg>
  );
}

export function ArrowIcon({ size = 22, color = "var(--ground)" }: IconProps) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 22 22" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11 L18 11 M12 5 L18 11 L12 17" />
    </svg>
  );
}

export function BackIcon({ size = 22, color = "var(--chalk)" }: IconProps) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 22 22" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 11 L4 11 M10 5 L4 11 L10 17" />
    </svg>
  );
}

export function CheckIcon({ size = 18, color = "var(--ground)" }: IconProps) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9 L7 13 L15 4" />
    </svg>
  );
}

export function LockIcon({ size = 22, color = "var(--muted)" }: IconProps) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 22 22" fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 10 V7 Q6 3 11 3 Q16 3 16 7 V10" />
      <path d="M4 10 L18 10 L18 19 L4 19 Z" />
      <path d="M11 13.5 L11 15.5" />
    </svg>
  );
}

export function StarIcon({ size = 18, filled = true }: IconProps & { filled?: boolean }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 20 20">
      <path
        d="M10 2 L12.4 7.2 L18 7.8 L13.8 11.6 L15 17.2 L10 14.3 L5 17.2 L6.2 11.6 L2 7.8 L7.6 7.2 Z"
        fill={filled ? "var(--points)" : "none"}
        stroke={filled ? "var(--points)" : "var(--line-strong)"}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RerollIcon({ size = 22, color = "var(--soft)" }: IconProps) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 22 22" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8 Q16 3 10 3 Q4 4 3 10 M4 14 Q6 19 12 19 Q18 18 19 12 M18 3 L18 8 L13 8 M4 19 L4 14 L9 14" />
    </svg>
  );
}

export function HoneypotIcon({ size = 34, color = "var(--epic-light)" }: IconProps) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 34 34" fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 13 Q5 30 17 30 Q29 30 27 13 Z M5 13 L29 13 M12 13 Q11 7 17 7 Q23 7 22 13" />
      <path d="M14 19 L14 20 M20 19 L20 20" />
    </svg>
  );
}

export function PowerIcon({ size = 34, color = "var(--threat)" }: IconProps) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 34 34" fill="none" stroke={color} strokeWidth="2.8" strokeLinecap="round">
      <path d="M17 4 L17 15 M10 9 Q4 14 6 21 Q9 30 17 30 Q25 30 28 21 Q30 14 24 9" />
    </svg>
  );
}
