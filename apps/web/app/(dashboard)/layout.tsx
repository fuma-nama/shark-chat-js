import { ReactNode } from "react";
import { Provider } from "./layout.client";
import "cropperjs/dist/cropper.css";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <Provider>{children}</Provider>;
}
