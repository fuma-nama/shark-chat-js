import { useMessageStore } from "@/utils/stores/chat";
import { trpc } from "@/utils/trpc";
import { getMessageVariables } from "@/utils/variables";
import { useSession } from "next-auth/react";
import { useEffect, Fragment, ReactNode } from "react";
import { Button } from "ui/components/button";
import { useChatView, UnreadSeparator } from "./ChatView";
import { ChatMessageItem } from "./GroupMessageItem";
import { LocalMessageItem } from "./LocalMessageItem";
import { setChannelUnread } from "@/utils/handlers/realtime/shared";

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

    const pages = query.data?.pages;
    const { scrollToBottom, sentryRef } = useChatView({
        hasNextPage: query.hasPreviousPage ?? true,
        onLoadMore: () => query.isSuccess && query.fetchPreviousPage(),
        disabled: query.isLoading,
        loading: query.isFetchingPreviousPage,
    });

    useEffect(() => {
        scrollToBottom();
    }, [pages, sending, scrollToBottom]);

    return (
        <div className="flex flex-col gap-3 mb-8">
            {query.isLoading || query.hasPreviousPage ? (
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
            {pages
                ?.flatMap((messages) => [...messages].reverse())
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
