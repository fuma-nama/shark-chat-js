"use client";
import { BookmarkIcon } from "lucide-react";
import { MessageList } from "@/components/chat/MessageList";
import { Sendbar } from "@/components/chat/Sendbar";
import { ChatViewport } from "@/components/chat/ChatView";
import { useGroupContext } from "@/utils/contexts/group-context";
import { useSession } from "next-auth/react";

export default function Page() {
  const { data: session } = useSession();
  const { channel_id: channelId, member, owner_id } = useGroupContext();

  return (
    <ChatViewport deleteMessage={member.admin || owner_id === session?.user.id}>
      <MessageList channelId={channelId} welcome={<Welcome />} />
      <Sendbar channelId={channelId} />
    </ChatViewport>
  );
}

function Welcome() {
  return (
    <div className="flex flex-col mb-8 bg-gradient-to-b from-brand-500/10 p-4">
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
