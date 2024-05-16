"use client";
import { Navbar } from "@/components/layout/Navbar";
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

  const query = trpc.dm.channels.useQuery(undefined, { enabled: false });
  const channel = query.data?.find((item) => item.id === params.channel);

  return query.data == null ? (
    <div className={skeleton()} />
  ) : (
    <div className="flex flex-row gap-2 items-center">
      <Avatar
        src={channel?.user.image}
        fallback={channel?.user.name}
        size="small"
      />
      <span>{channel?.user.name}</span>
    </div>
  );
}
