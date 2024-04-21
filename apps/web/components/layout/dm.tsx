import { trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { AppLayout, Content } from "./app";
import { ReactNode } from "react";
import { skeleton } from "ui/components/skeleton";
import { Avatar } from "ui/components/avatar";
import { useViewScrollController } from "ui/hooks/use-bottom-scroll";
import { Navbar } from "./Navbar";
import { ChannelSendbar } from "../chat/ChannelSendbar";
import { ChatViewProvider } from "../chat/ChatView";

export function useDirectMessageLayout(children: ReactNode) {
  const router = useRouter();
  const controller = useViewScrollController();

  return (
    <AppLayout>
      <Navbar
        breadcrumb={[
          {
            text: <BreadcrumbItem />,
            href: router.asPath,
          },
        ]}
      />

      <Content>
        <ChatViewProvider value={controller}>{children}</ChatViewProvider>
      </Content>
      <ChannelSendbar channelId={router.query.channel as string} />
    </AppLayout>
  );
}

function BreadcrumbItem() {
  const { channel } = useRouter().query as { channel: string };
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
