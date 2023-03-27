import { trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";
import { NextRouter, useRouter } from "next/router";
import { NextPageWithLayout } from "../../_app";
import { BookmarkIcon, GearIcon } from "@radix-ui/react-icons";
import { useEffect } from "react";
import clsx from "clsx";
import React from "react";
import { Sendbar } from "@/components/chat/Sendbar";
import { useMessageHandlers } from "@/utils/handlers/ably";
import { Spinner } from "@/components/system/spinner";
import { GroupMessageItem } from "@/components/chat/GroupMessageItem";
import { button } from "@/components/system/button";
import Link from "next/link";
import { useGroupLayout } from "@/components/layout/group";
import { ChatViewLayout, useChatView } from "@/components/chat/ChatView";

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
    const { scrollToBottom, sentryRef } = useChatView({
        hasNextPage: query.hasPreviousPage ?? true,
        onLoadMore: () => query.fetchPreviousPage(),
        disabled: query.isLoading,
        loading: query.isFetchingPreviousPage,
    });

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
                {pages?.map((messages) =>
                    [...messages]
                        .reverse()
                        .map((message) => (
                            <GroupMessageItem
                                key={message.id}
                                message={message}
                            />
                        ))
                )}
            </div>
            <GroupSendbar />
        </>
    );
};

function GroupSendbar() {
    const { groupId } = getQuery(useRouter());
    const sendMutation = trpc.chat.send.useMutation();

    return (
        <Sendbar
            isLoading={sendMutation.isLoading}
            onSend={({ content }) =>
                sendMutation.mutateAsync({ message: content, groupId })
            }
        />
    );
}

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

GroupChat.useLayout = (children) =>
    useGroupLayout((group) => ({
        children,
        layout: ChatViewLayout,
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
