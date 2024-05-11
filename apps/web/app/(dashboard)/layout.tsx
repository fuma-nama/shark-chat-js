import { ReactNode } from "react";
import { Provider } from "./layout.client";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <Provider>{children}</Provider>;
}
