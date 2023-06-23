import { useMessageStore } from "@/utils/stores/chat";
import { trpc } from "@/utils/trpc";
import { getMessageVariables } from "@/utils/variables";
import { useSession } from "next-auth/react";
import {
    ReactNode,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
} from "react";
import { Button } from "ui/components/button";
import { ChatMessageItem } from "./message";
import { LocalMessageItem } from "./message/sending";
import { setChannelUnread } from "@/utils/handlers/realtime/shared";
import { Virtualizer, useWindowVirtualizer } from "@tanstack/react-virtual";
import { useRouter } from "next/router";

const useIsomorphicLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect;

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
    const itemSize = 76;
    const [sending, remove] = useMessageStore((s) => [
        s.sending[channelId] ?? [],
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

    const pages = query.data?.pages;

    const rows = useMemo(
        () => pages?.flatMap((messages) => [...messages].reverse()) ?? [],
        [pages]
    );

    const virtualizerRef = useRef<Virtualizer<Window, Element> | null>(null);
    const count = rows.length + sending.length;

    if (
        virtualizerRef.current &&
        count !== virtualizerRef.current.options.count
    ) {
        const delta = count - virtualizerRef.current.options.count;
        const nextOffset =
            virtualizerRef.current.scrollOffset + delta * itemSize;

        virtualizerRef.current.scrollOffset = nextOffset;
        virtualizerRef.current.scrollToOffset(nextOffset, {
            align: "start",
        });
    }

    useIsomorphicLayoutEffect(() => {
        virtualizerRef.current?.scrollToOffset(
            document.scrollingElement!!.scrollHeight,
            {
                align: "start",
            }
        );
    }, [useRouter()]);

    const virtualizer = useWindowVirtualizer({
        count,
        estimateSize: () => itemSize,
        getItemKey: useCallback(
            (index: number) =>
                index >= rows.length
                    ? sending[index - rows.length].nonce
                    : rows[index].id,
            [rows, sending]
        ),
        scrollMargin: 200,
        overscan: 5,
    });

    useIsomorphicLayoutEffect(() => {
        virtualizerRef.current = virtualizer;
    });

    const items = virtualizer.getVirtualItems();

    const [paddingTop, paddingBottom] =
        items.length > 0
            ? [
                  Math.max(
                      0,
                      items[0].start - virtualizer.options.scrollMargin
                  ),
                  Math.max(
                      0,
                      virtualizer.getTotalSize() - items[items.length - 1].end
                  ),
              ]
            : [0, 0];

    useIsomorphicLayoutEffect(() => {
        if (items.length > 0 && items[0].index === 0) {
            if (
                !query.isFetchingPreviousPage &&
                !query.isLoading &&
                query.isSuccess &&
                (query.hasPreviousPage ?? true)
            ) {
                query.fetchPreviousPage();
            }
        }
    }, [items]);

    if (query.isLoading) {
        return <></>;
    }
    return (
        <div>
            <div className="overflow-hidden h-[200px]">
                {(query.isLoading || query.hasPreviousPage) && (
                    <div className="flex flex-col gap-3">
                        {new Array(40).fill(0).map((_, i) => (
                            <Skeleton key={i} />
                        ))}
                    </div>
                )}
                {query.isError && (
                    <div>
                        <p>{query.error.message}</p>
                        <Button color="danger" onClick={() => query.refetch()}>
                            Retry
                        </Button>
                    </div>
                )}
                {!query.hasPreviousPage && !query.isError && welcome}
            </div>

            <div
                style={{
                    overflowAnchor: "none",
                    paddingTop,
                    paddingBottom,
                }}
            >
                {items.map((item) => {
                    const i = item.index;

                    if (i >= rows.length) {
                        const info = sending[i - rows.length];

                        return (
                            <div
                                key={item.key}
                                data-index={item.index}
                                ref={virtualizer.measureElement}
                                className="pt-3"
                            >
                                <LocalMessageItem
                                    item={info}
                                    onDelete={() =>
                                        remove(channelId, info.nonce)
                                    }
                                />
                            </div>
                        );
                    }

                    const message = rows[i];
                    const prev_message = i > 0 ? rows[i - 1] : null;
                    const newLine =
                        lastRead != null &&
                        lastRead < new Date(message.timestamp) &&
                        (prev_message == null ||
                            new Date(prev_message.timestamp) <= lastRead);

                    return (
                        <div
                            key={item.key}
                            data-index={item.index}
                            ref={virtualizer.measureElement}
                            className="pb-3"
                        >
                            {newLine && <UnreadSeparator />}
                            <ChatMessageItem message={message} />
                        </div>
                    );
                })}
            </div>
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
        <div
            className="flex flex-row gap-2 items-center"
            aria-label="separator"
        >
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
        }
    );

    return checkoutQuery.data?.last_read != null
        ? new Date(checkoutQuery.data.last_read)
        : null;
}
