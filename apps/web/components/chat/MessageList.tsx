import { useMessageStore } from "@/utils/stores/chat";
import { trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";
import { Fragment, ReactNode, useLayoutEffect } from "react";
import { Button } from "ui/components/button";
import { useChatView, useChatViewContext } from "./ChatView";
import { ChatMessageItem } from "./message";
import { LocalMessageItem } from "./message/sending";
import { setChannelUnread } from "@/utils/handlers/realtime/shared";

const count = 30;

function ScrollUpdate({ channelId }: { channelId: string }) {
  const { updateScrollPosition, resetScroll } = useChatViewContext();
  const deps = useMessageStore((s) => [
    s.sending[channelId],
    s.messages[channelId],
    s.editing[channelId],
    s.sendbar,
  ]);

  useLayoutEffect(() => {
    updateScrollPosition();
  }, [deps, updateScrollPosition]);

  useLayoutEffect(() => {
    resetScroll();
  }, [channelId, resetScroll]);

  return <></>;
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
  const [sending, messages, pointer] = useMessageStore((s) => [
    s.sending[channelId] ?? [],
    s.messages[channelId] ?? [],
    s.pointer[channelId],
  ]);

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

      useMessageStore.setState((prev) => ({
        pointer: {
          ...prev.pointer,
          [channelId]:
            messages.length > 0
              ? new Date(messages[0].timestamp).getTime()
              : undefined,
        },
      }));
    },
    loading: query.isLoading,
  });

  return (
    <div className="flex flex-col gap-3 mb-8 max-w-screen-2xl w-full mx-auto flex-1 pt-2 p-4">
      <ScrollUpdate channelId={channelId} />
      {showSkeleton ? (
        <div ref={sentryRef} className="flex flex-col gap-3">
          {new Array(40).fill(0).map((_, i) => (
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
      {messages.map((message, i, arr) => {
        const prev_message = i > 0 ? arr[i - 1] : null;
        const newLine =
          lastRead != null &&
          lastRead < new Date(message.timestamp) &&
          (prev_message == null ||
            new Date(prev_message.timestamp) <= lastRead);

        return (
          <Fragment key={message.id}>
            {newLine && <UnreadSeparator />}
            <ChatMessageItem message={message} />
          </Fragment>
        );
      })}

      {sending.map((message) => (
        <LocalMessageItem key={message.nonce} item={message} />
      ))}
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
      <div className="h-[1px] flex-1 bg-red-500 dark:bg-red-400" />
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
