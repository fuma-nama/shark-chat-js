import { useMessageStore } from "@/utils/stores/chat";
import { trpc } from "@/utils/trpc";
import { getMessageVariables } from "@/utils/variables";
import { useSession } from "next-auth/react";
import { Fragment, ReactNode, useLayoutEffect, useMemo, useState } from "react";
import { Button } from "ui/components/button";
import { useChatView } from "./ChatView";
import { ChatMessageItem } from "./message";
import { LocalMessageItem } from "./message/sending";
import { setChannelUnread } from "@/utils/handlers/realtime/shared";
import { useRouter } from "next/router";

const BLOCK_SIZE = 15;
export function MessageList({
  channelId,
  welcome,
}: {
  channelId: string;
  welcome: ReactNode;
}) {
  const { status } = useSession();
  const variables = getMessageVariables(channelId);
  const lastRead = useLastRead(channelId);
  const [range, setRange] = useState<[start: number, end: number]>([
    0,
    BLOCK_SIZE,
  ]);
  const [sending, remove] = useMessageStore((s) => [
    s.sending[channelId],
    s.removeSending,
  ]);

  const query = trpc.chat.messages.useInfiniteQuery(variables, {
    enabled: status === "authenticated",
    staleTime: Infinity,
    getPreviousPageParam: (messages) =>
      messages.length >= variables.count
        ? messages[messages.length - 1].timestamp
        : null,
  });

  const rows = useMemo(
    () =>
      query.data?.pages?.flatMap((messages) => [...messages].reverse()) ?? [],
    [query.data?.pages],
  );

  const showSkeleton =
    query.isLoading || query.hasPreviousPage || rows.length - 1 > range[1];

  const { sentryRef, resetScroll, updateScrollPosition } = useChatView({
    hasNextPage: (query.hasPreviousPage ?? true) || rows.length - 1 > range[1],
    onLoadMore: () => {
      if (!query.isSuccess || query.isFetchingPreviousPage) return;

      if (rows.length - 1 > range[1]) {
        setRange((prev) => [prev[0], prev[1] + BLOCK_SIZE]);

        if (rows.length - 1 > range[1] + BLOCK_SIZE) return;
      }

      if (query.hasPreviousPage) {
        query.fetchPreviousPage();
      }
    },
    disabled: query.isLoading,
    loading: query.isFetchingPreviousPage,
  });

  useLayoutEffect(() => {
    resetScroll();
    setRange([0, BLOCK_SIZE]);
  }, [useRouter()]);

  useLayoutEffect(() => {
    updateScrollPosition();
  }, [rows, range, sending, updateScrollPosition]);

  return (
    <div className="flex flex-col gap-3 mb-8">
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
      {rows
        .slice(
          Math.max(0, rows.length - range[1] - 1),
          Math.min(Number.MAX_VALUE, Math.max(0, rows.length - range[0])),
        )
        .map((message, i, arr) => {
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

      {sending?.map((message) => (
        <LocalMessageItem
          key={message.nonce}
          item={message}
          onDelete={() => remove(channelId, message.nonce)}
        />
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
  const utils = trpc.useContext();

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
