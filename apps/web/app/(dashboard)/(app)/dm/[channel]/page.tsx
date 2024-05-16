"use client";
import { Avatar } from "ui/components/avatar";
import { trpc } from "@/utils/trpc";
import { MessageList } from "@/components/chat/MessageList";
import { ChatViewport } from "@/components/chat/ChatView";
import { Sendbar } from "@/components/chat/Sendbar";

export default function Page({ params }: { params: { channel: string } }) {
  return (
    <ChatViewport deleteMessage={false}>
      <MessageList
        channelId={params.channel}
        welcome={<Welcome channel={params.channel} />}
      />
      <Sendbar channelId={params.channel} />
    </ChatViewport>
  );
}

function Welcome({ channel }: { channel: string }) {
  const query = trpc.dm.info.useQuery({ channelId: channel });

  const data = query.data;

  if (!data?.user) return <div></div>;

  return (
    <div className="flex flex-col mb-8 p-4">
      <Avatar
        src={data?.user?.image}
        fallback={data?.user?.name}
        size="large"
        className="mb-4"
      />
      <h1 className="text-lg lg:text-xl font-bold">{data.user.name}</h1>
      <p className="text-muted-foreground text-sm">
        Start your conversations with {data.user.name}
      </p>
    </div>
  );
}
