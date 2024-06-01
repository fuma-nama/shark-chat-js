"use client";
import { useParams } from "next/navigation";
import { useGroup } from "@/app/(dashboard)/(app)/chat/[group]/use-group";
import { GroupContext } from "@/utils/contexts/group-context";
import { Spinner } from "ui/components/spinner";

export default function Layout({ children }: { children: React.ReactNode }) {
  const params = useParams() as { group: string };
  const info = useGroup(params.group);

  return (
    <>
      {info ? (
        <GroupContext.Provider value={info}>{children}</GroupContext.Provider>
      ) : (
        <Spinner size="large" className="m-auto p-12" />
      )}
    </>
  );
}
