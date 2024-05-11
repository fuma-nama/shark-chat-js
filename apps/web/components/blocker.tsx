"use client";
import { ReactNode } from "react";
import { trpc } from "@/utils/trpc";
import { Spinner } from "ui/components/spinner";

export function Blocker({ children }: { children: ReactNode }) {
  const groupQuery = trpc.group.all.useQuery(undefined, {
    enabled: false,
  });
  const dmQuery = trpc.dm.channels.useQuery(undefined, {
    enabled: false,
  });

  if (groupQuery.isLoading || dmQuery.isLoading) {
    return (
      <div className="m-auto">
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl w-full mx-auto flex flex-col flex-1 pt-2 p-4">
      {children}
    </div>
  );
}
