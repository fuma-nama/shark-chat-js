import Sidebar from "@/components/layout/Sidebar";
import React, { ReactNode } from "react";
import { Provider } from "./layout.client";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <Provider>
      <main className="grid grid-cols-1 md:grid-cols-[20rem_auto]">
        <Sidebar />
        <div className="flex flex-col min-h-svh">{children}</div>
      </main>
    </Provider>
  );
}
