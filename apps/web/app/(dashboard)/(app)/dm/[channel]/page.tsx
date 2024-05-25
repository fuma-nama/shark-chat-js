"use client";
import { Avatar } from "ui/components/avatar";
import { trpc } from "@/utils/trpc";
import { MessageList } from "@/components/chat/MessageList";
import { ChatViewport } from "@/components/chat/ChatView";
import { Sendbar } from "@/components/chat/Sendbar";
import { UserInfo } from "shared/schema/chat";

export default function Page({ params }: { params: { channel: string } }) {
  const query = trpc.dm.info.useQuery({ channelId: params.channel });

  return (
    <>
      <div className="relative flex-1">
        <ChatViewport deleteMessage={false}>
          <MessageList
            channelId={params.channel}
            ready={query.isSuccess}
            welcome={
              query.isSuccess ? <Welcome info={query.data?.user} /> : null
            }
          />
        </ChatViewport>
      </div>
      <Sendbar channelId={params.channel} />
    </>
  );
}

function Welcome({ info }: { info: UserInfo }) {
  return (
    <div className="flex flex-col mb-8 p-4">
      <Avatar
        src={info.image}
        fallback={info.name}
        size="large"
        className="mb-4"
      />
      <h1 className="text-lg lg:text-xl font-bold">{info.name}</h1>
      <p className="text-muted-foreground text-sm">
        Start your conversations with {info.name}
      </p>
    </div>
  );
}
