import { useMessageStore } from "@/utils/stores/chat";
import { trpc } from "@/utils/trpc";
import { createContext, ReactNode, useMemo, useRef } from "react";
import { Button } from "ui/components/button";
import { ChatMessageItem } from "./message";
import { LocalMessageItem } from "./message/sending";
import { setChannelUnread } from "@/utils/handlers/shared";
import { ListItem, useItems } from "@/components/chat/use-items";
import { useCallbackRef } from "@/utils/hooks/use-callback-ref";
import { useBottomScroll } from "@/components/chat/scroll";

const count = 30;

type ScrollContextType = {
  scrollToMessage: (id: number) => void;
};

export const ScrollContext = createContext<ScrollContextType | undefined>(
  undefined,
);

export function MessageList({
  channelId,
  ready = true,
  welcome,
}: {
  channelId: string;
  ready?: boolean;
  welcome: ReactNode;
}) {
  const lastRead = useLastRead(channelId);
  const pointer = useMessageStore((s) => s.pointer.get(channelId));

  const query = trpc.chat.messages.useQuery(
    { channelId, count, before: pointer },
    {
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
  const onLoad = useCallbackRef(() => {
    if (!query.isSuccess || query.isLoading || !showSkeleton) return;

    useMessageStore.getState().updatePointer(channelId);
  });

  return (
    <VirtualScroll
      channelId={channelId}
      lastRead={lastRead?.getTime() ?? null}
      onLoad={onLoad}
    >
      {showSkeleton || !ready ? (
        <div className="flex flex-col gap-3">
          {new Array(20).fill(0).map((_, i) => (
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
    </VirtualScroll>
  );
}

function VirtualScroll({
  lastRead,
  channelId,
  onLoad,
  children: header,
}: {
  channelId: string;
  lastRead: number | null;
  onLoad: () => void;
  children: ReactNode;
}) {
  const items = useItems(channelId, lastRead);
  const headerShownRef = useRef(false);
  const scroll = useBottomScroll();

  const info = scroll.info.get("heading");
  if (info && info.isIntersecting) {
    if (!headerShownRef.current) onLoad();
    headerShownRef.current = true;
  } else {
    headerShownRef.current = false;
  }

  const scrollToMessage = useCallbackRef((id: number) => {
    const idx = items.findLastIndex(
      (item) => item.type === "message" && item.message.id === id,
    );
    if (idx === -1) return;
    const element = document.getElementById(`scroll_${id}`);
    element?.scrollIntoView();
  });

  function render(item: ListItem) {
    const info = scroll.info.get(item.id.toString());
    if (info && !info.isIntersecting)
      return (
        <div
          id={`scroll_${item.id}`}
          key={item.id}
          data-key={item.id}
          ref={scroll.measure}
          style={{
            height: info.height,
          }}
        />
      );

    let node;
    switch (item.type) {
      case "message":
        node = <ChatMessageItem {...item} />;
        break;
      case "pending":
        node = <LocalMessageItem {...item} />;
        break;
      case "unread":
        node = <UnreadSeparator />;
        break;
    }

    return (
      <div
        key={item.id}
        id={`scroll_${item.id}`}
        data-key={item.id}
        ref={scroll.measure}
      >
        {node}
      </div>
    );
  }

  return (
    <ScrollContext.Provider
      value={useMemo(() => ({ scrollToMessage }), [scrollToMessage])}
    >
      <div data-key="heading" ref={scroll.measure}>
        {header}
      </div>
      {items.map(render)}
    </ScrollContext.Provider>
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
  const utils = trpc.useUtils();

  const checkoutQuery = trpc.chat.checkout.useQuery(
    { channelId: channelId },
    {
      refetchOnWindowFocus: false,
      onSuccess: () => setChannelUnread(utils, channelId, () => 0),
    },
  );

  return checkoutQuery.data?.last_read != null
    ? new Date(checkoutQuery.data.last_read)
    : null;
}
