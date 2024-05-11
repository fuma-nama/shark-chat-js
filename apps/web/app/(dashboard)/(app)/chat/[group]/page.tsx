"use client";
import { BookmarkIcon } from "lucide-react";
import { ChannelSendbar } from "@/components/chat/ChannelSendbar";
import { MessageList } from "@/components/chat/MessageList";
import { ChatViewProvider } from "@/components/chat/ChatView";
import { useGroup } from "@/app/(dashboard)/(app)/chat/[group]/use-group";
import { Spinner } from "ui/components/spinner";

export default function Page({ params }: { params: { group: string } }) {
  const channelId = useGroup(params.group)?.channel_id;
  if (channelId == null) return <Spinner size="large" className="m-auto" />;

  return (
    <>
      <ChatViewProvider>
        <MessageList channelId={channelId} welcome={<Welcome />} />
      </ChatViewProvider>
      <ChannelSendbar channelId={channelId} />
    </>
  );
}

function Welcome() {
  return (
    <div className="flex flex-col mb-8 bg-gradient-to-b from-brand-500/10 -mx-4 p-4">
      <BookmarkIcon className="size-10 bg-brand p-2 mb-2 md:size-14 md:p-3 rounded-full text-accent-50" />
      <h1 className="text-lg md:text-xl font-bold">
        The beginning of this story
      </h1>
      <p className="text-accent-800 dark:text-accent-600 text-sm">
        Let&apos;s send your messages here!
      </p>
    </div>
  );
}
