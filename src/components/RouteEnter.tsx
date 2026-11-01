import type { ReactNode } from "react";
import styles from "./routeEnter.module.css";

export function RouteEnter({ children }: { children: ReactNode }) {
  return <div className={styles.enter}>{children}</div>;
}
