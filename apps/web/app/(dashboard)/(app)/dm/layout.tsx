"use client";
import { Navbar } from "@/components/layout/Navbar";
import { ChatViewport, ChatViewProvider } from "@/components/chat/ChatView";
import { ChannelSendbar } from "@/components/chat/ChannelSendbar";
import { useSession } from "next-auth/react";
import { trpc } from "@/utils/trpc";
import { skeleton } from "ui/components/skeleton";
import { Avatar } from "ui/components/avatar";
import { useParams } from "next/navigation";

export default function Layout({ children }: { children: React.ReactNode }) {
  const params = useParams() as { channel: string };

  return (
    <ChatViewport>
      <Navbar
        breadcrumb={[
          {
            id: "dm",
            text: <BreadcrumbItem channel={params.channel} />,
          },
        ]}
      />

      <ChatViewProvider>{children}</ChatViewProvider>

      <ChannelSendbar channelId={params.channel} />
    </ChatViewport>
  );
}

function BreadcrumbItem({ channel }: { channel: string }) {
  const { status } = useSession();
  const query = trpc.dm.info.useQuery(
    { channelId: channel },
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
