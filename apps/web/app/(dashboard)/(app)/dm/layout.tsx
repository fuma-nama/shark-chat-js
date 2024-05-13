"use client";
import { Navbar } from "@/components/layout/Navbar";
import { useSession } from "next-auth/react";
import { trpc } from "@/utils/trpc";
import { skeleton } from "ui/components/skeleton";
import { Avatar } from "ui/components/avatar";
import { useParams } from "next/navigation";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex flex-col min-h-dvh">
      <Navbar
        breadcrumb={[
          {
            id: "dm",
            text: <BreadcrumbItem />,
          },
        ]}
      />
      {children}
    </div>
  );
}

function BreadcrumbItem() {
  const params = useParams() as { channel: string };

  const { status } = useSession();
  const query = trpc.dm.info.useQuery(
    { channelId: params.channel },
    { enabled: status === "authenticated", staleTime: Infinity },
  );

  return query.data == null ? (
    <div className={skeleton()} />
  ) : (
    <div className="flex flex-row gap-2 items-center">
      <Avatar
        src={query.data.user.image}
        fallback={query.data.user.name}
        size="small"
      />
      <span>{query.data.user.name}</span>
    </div>
  );
}
