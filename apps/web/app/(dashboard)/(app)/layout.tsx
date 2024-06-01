import Sidebar from "@/components/layout/Sidebar";
import React, { ReactNode } from "react";
import { Nav, Provider } from "./layout.client";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <Provider>
      <main className="grid grid-cols-1 md:grid-cols-[20rem_auto]">
        <Sidebar />
        <div className="flex flex-col min-h-dvh">
          <Nav />
          {children}
        </div>
      </main>
    </Provider>
  );
}
