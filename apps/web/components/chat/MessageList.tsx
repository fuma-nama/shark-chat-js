import { useMessageStore } from "@/utils/stores/chat";
import { trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";
import { ReactNode } from "react";
import { Button } from "ui/components/button";
import { useChatView } from "./ChatView";
import { ChatMessageItem } from "./message";
import { LocalMessageItem } from "./message/sending";
import { setChannelUnread } from "@/utils/handlers/shared";
import { useItems } from "@/components/chat/use-items";

const count = 30;

export function MessageList({
  channelId,
  welcome,
}: {
  channelId: string;
  welcome: ReactNode;
}) {
  const { status } = useSession();
  const lastRead = useLastRead(channelId);
  const pointer = useMessageStore((s) => s.pointer.get(channelId));

  const query = trpc.chat.messages.useQuery(
    { channelId, count, before: pointer },
    {
      enabled: status === "authenticated",
      staleTime: Infinity,
      onSuccess(data) {
        useMessageStore.setState((prev) => ({
          messages: {
            ...prev.messages,
            [channelId]: [...data, ...(prev.messages[channelId] ?? [])],
          },
        }));
        console.log(`Loaded new chunk: ${data.length} items`);
      },
    },
  );

  const showSkeleton = !query.data || query.data.length === count;

  const { sentryRef } = useChatView({
    hasNextPage: showSkeleton,
    onLoadMore() {
      if (!query.isSuccess || query.isLoading) return;

      useMessageStore.getState().updatePointer(channelId);
    },
    loading: query.isLoading,
  });

  const items = useItems(channelId, lastRead);

  return (
    <div className="flex flex-col gap-3 mb-8 flex-1 py-2">
      {showSkeleton ? (
        <div ref={sentryRef} className="flex flex-col gap-3">
          {new Array(30).fill(0).map((_, i) => (
            <Skeleton key={i} />
          ))}
        </div>
      ) : query.isError ? (
        <>
          <p>{query.error.message}</p>
          <Button color="danger" onClick={() => query.refetch()}>
            Retry
          </Button>
        </>
      ) : (
        welcome
      )}
      {items.map((item) => {
        switch (item.type) {
          case "message":
            return <ChatMessageItem key={item.id} {...item} />;
          case "pending":
            return <LocalMessageItem key={item.id} {...item} />;
          case "unread":
            return <UnreadSeparator key={item.id} />;
        }
      })}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="flex flex-row gap-3 p-4 rounded-xl opacity-20">
      <div className="bg-muted-foreground rounded-full size-12" />
      <div className="flex flex-col gap-3 flex-1">
        <div className="flex flex-row gap-3 items-center">
          <div className="bg-muted-foreground rounded-xl h-3 w-20" />
          <div className="bg-muted-foreground rounded-xl h-3 w-8" />
        </div>
        <div className="bg-muted-foreground rounded-xl h-3 max-w-xl" />
        <div className="bg-muted-foreground rounded-xl h-3 max-w-md" />
      </div>
    </div>
  );
}

function UnreadSeparator() {
  return (
    <div className="flex flex-row gap-2 items-center" aria-label="separator">
      <div className="h-[1px] flex-1 bg-red-500 dark:bg-red-400" />
      <p className="text-red-500 dark:text-red-400 text-sm mx-auto">
        New Message
      </p>
      <div className="h-px flex-1 bg-red-500 dark:bg-red-400" />
    </div>
  );
}

function useLastRead(channelId: string) {
  const { status } = useSession();
  const utils = trpc.useUtils();

  const checkoutQuery = trpc.chat.checkout.useQuery(
    { channelId: channelId },
    {
      enabled: status === "authenticated",
      refetchOnWindowFocus: false,
      onSuccess: () => setChannelUnread(utils, channelId, () => 0),
    },
  );

  return checkoutQuery.data?.last_read != null
    ? new Date(checkoutQuery.data.last_read)
    : null;
}
