import type { ReactNode } from "react";
import { RouteEnter } from "@/components/RouteEnter";

export default function Template({ children }: { children: ReactNode }) {
  return <RouteEnter>{children}</RouteEnter>;
}
