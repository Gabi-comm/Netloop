import type { ReactNode } from "react";
import styles from "./placeholder.module.css";

export function Placeholder({ folder, children }: { owner: string; folder: string; children?: ReactNode }) {
  return (
    <section className={styles.box}>
      <code className={styles.path}>{folder}</code>
      {children}
    </section>
  );
}
