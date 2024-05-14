import { MessagePlaceholder, useMessageStore } from "@/utils/stores/chat";
import { trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";
import { ReactNode, useMemo } from "react";
import { Button } from "ui/components/button";
import { useChatView } from "./ChatView";
import { ChatMessageItem } from "./message";
import { LocalMessageItem } from "./message/sending";
import { setChannelUnread } from "@/utils/handlers/realtime/shared";
import { MessageType } from "@/utils/types";

const count = 30;

type ListItem =
  | {
      id: number;
      type: "message";
      message: MessageType;
      chain: boolean;
    }
  | {
      id: string;
      type: "unread";
    }
  | {
      type: "pending";
      id: string;
      message: MessagePlaceholder;
      chain: boolean;
    };

function useItems(channelId: string, lastRead: Date | null): ListItem[] {
  const { data } = useSession();
  const [sending, messages] = useMessageStore((s) => [
    s.sending[channelId] ?? [],
    s.messages[channelId] ?? [],
  ]);

  return useMemo(() => {
    const items: ListItem[] = [];
    let previousTimestamp: Date | undefined;
    if (!data) return [];

    for (const message of messages) {
      const prev = items.length > 0 ? items.at(-1) : undefined;
      const time = new Date(message.timestamp);

      if (
        lastRead &&
        lastRead < time &&
        (!previousTimestamp || previousTimestamp <= lastRead)
      )
        items.push({
          id: `unread:${lastRead.getTime()}`,
          type: "unread",
        });

      items.push({
        id: message.id,
        type: "message",
        message,
        chain:
          message.author != null &&
          prev?.type === "message" &&
          prev.message.author?.id === message.author.id &&
          time.getTime() - new Date(prev.message.timestamp).getTime() <=
            10 * 1000 &&
          message.reply_id == null,
      });
      previousTimestamp = time;
    }

    for (const message of sending) {
      const prev = items.length > 0 ? items.at(-1) : undefined;

      items.push({
        id: `pending:${message.nonce}`,
        type: "pending",
        message,
        chain:
          prev?.type === "message" &&
          prev.message.author?.id === data.user.id &&
          Date.now() - new Date(prev.message.timestamp).getTime() <=
            10 * 1000 &&
          message.reply == null,
      });
    }

    return items;
  }, [data, messages, lastRead, sending]);
}

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
            return (
              <ChatMessageItem
                key={item.id}
                message={item.message}
                chain={item.chain}
              />
            );
          case "pending":
            return (
              <LocalMessageItem
                key={item.id}
                item={item.message}
                chain={item.chain}
              />
            );
          case "unread":
            return <UnreadSeparator key={item.id} />;
        }
      })}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="flex flex-row gap-3 p-4 rounded-xl bg-card">
      <div className="bg-muted-foreground rounded-full h-12 w-12 opacity-20" />
      <div className="flex flex-col gap-3 flex-1 opacity-20">
        <div className="flex flex-row gap-3 items-center">
          <div className="bg-muted-foreground rounded-xl h-4 w-20" />
          <div className="bg-muted-foreground rounded-xl h-4 w-8" />
        </div>
        <div className="bg-muted-foreground rounded-xl h-4 max-w-xl" />
        <div className="bg-muted-foreground rounded-xl h-4 max-w-md" />
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
