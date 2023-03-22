import { trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";
import { NextRouter, useRouter } from "next/router";
import { NextPageWithLayout } from "../../_app";
import { BookmarkIcon, GearIcon } from "@radix-ui/react-icons";
import {
    createContext,
    ReactNode,
    RefObject,
    useContext,
    useEffect,
} from "react";
import clsx from "clsx";
import useInfiniteScroll from "react-infinite-scroll-hook";
import React from "react";
import { useBottomScroll } from "@/utils/use-bottom-scroll";
import { Sendbar } from "@/components/chat/Sendbar";
import { useMessageHandlers } from "@/utils/handlers/ably";
import { Spinner } from "@/components/system/spinner";
import { MessageItem } from "@/components/chat/MessageItem";
import { button } from "@/components/system/button";
import Link from "next/link";
import { useGroupLayout } from "@/components/layout/group";

const ViewContext = createContext<
    | {
          viewRef: RefObject<HTMLDivElement>;
          scrollToBottom: () => void;
      }
    | undefined
>(undefined);

export function getQuery(router: NextRouter) {
    const query = router.query as {
        group: string;
    };

    return {
        groupId: Number(query.group),
    };
}

const GroupChat: NextPageWithLayout = () => {
    const group = getQuery(useRouter()).groupId;

    const { status } = useSession();
    const { scrollToBottom, viewRef } = useContext(ViewContext)!!;
    const variables = {
        groupId: group,
        count: 30,
        cursorType: "before",
    } as const;

    useMessageHandlers(variables);
    const query = trpc.chat.messages.useInfiniteQuery(variables, {
        enabled: status === "authenticated",
        staleTime: Infinity,
        getPreviousPageParam: (messages) =>
            messages.length != 0
                ? messages[messages.length - 1].timestamp
                : null,
    });

    const pages = query.data?.pages;
    const [sentryRef, { rootRef }] = useInfiniteScroll({
        hasNextPage: query.hasPreviousPage ?? true,
        onLoadMore: () => {
            console.log("load more");

            return query.fetchPreviousPage();
        },
        disabled: query.isLoading,
        delayInMs: 100,
        loading: query.isFetchingPreviousPage,
        rootMargin: "20px",
    });

    useEffect(() => {
        rootRef(viewRef.current);
    }, [rootRef, viewRef]);

    useEffect(() => {
        scrollToBottom();
    }, [pages, scrollToBottom]);

    return (
        <>
            <div className="flex flex-col gap-3 mb-8">
                {query.isLoading || query.hasPreviousPage ? (
                    <div ref={sentryRef} className="flex flex-col m-auto">
                        <Spinner size="large" />
                    </div>
                ) : (
                    <Welcome />
                )}
                {pages?.map((messages, i) => (
                    <div
                        key={messages[0]?.id ?? `undefined-${i}`}
                        className="flex flex-col-reverse gap-3"
                    >
                        {messages.map((message) => (
                            <MessageItem key={message.id} message={message} />
                        ))}
                    </div>
                ))}
            </div>
            <Sendbar group={group} />
        </>
    );
};

function Welcome() {
    return (
        <div className="flex flex-col gap-3 mb-10">
            <BookmarkIcon
                className={clsx(
                    "w-10 h-10 md:w-20 md:h-20 bg-brand-500 p-2 rounded-xl text-accent-400",
                    "dark:bg-brand-400 dark:text-accent-50"
                )}
            />
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                The beginning of this Story
            </h1>
            <p className="text-accent-800 dark:text-accent-600 text-lg">
                Let&apos;s send your first message here
            </p>
        </div>
    );
}

function Body({ children }: { children: ReactNode }) {
    const { handleRootScroll, scrollableRootRef, scrollToBottom } =
        useBottomScroll();

    return (
        <ViewContext.Provider
            value={{ scrollToBottom, viewRef: scrollableRootRef }}
        >
            <div
                className="overflow-y-auto"
                ref={scrollableRootRef}
                onScroll={handleRootScroll}
            >
                {children}
            </div>
        </ViewContext.Provider>
    );
}

GroupChat.useLayout = (children) =>
    useGroupLayout((group) => ({
        children,
        layout: Body,
        items: (
            <>
                <Link
                    href={`/chat/${group}/settings`}
                    className={button({
                        color: "secondary",
                        className: "gap-2",
                    })}
                >
                    <GearIcon /> Settings
                </Link>
            </>
        ),
    }));
export default GroupChat;
