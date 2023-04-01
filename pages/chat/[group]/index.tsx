import { trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";
import { NextRouter, useRouter } from "next/router";
import { NextPageWithLayout } from "../../_app";
import { BookmarkIcon, GearIcon } from "@radix-ui/react-icons";
import { Fragment, useEffect, useMemo } from "react";
import clsx from "clsx";
import React from "react";
import { Sendbar } from "@/components/chat/Sendbar";
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

export function getVariables(groupId: number) {
    return {
        groupId,
        count: 30,
        cursorType: "before",
    } as const;
}

export function useVariables(groupId: number) {
    return useMemo(() => getVariables(groupId), [groupId]);
}

const GroupChat: NextPageWithLayout = () => {
    const group = getQuery(useRouter()).groupId;
    const { status } = useSession();
    const variables = useVariables(group);
    const lastRead = useLastRead(group);

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
                                <GroupMessageItem message={message} />
                            </Fragment>
                        );
                    })}
            </div>
            <GroupSendbar />
        </>
    );
};

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

function useLastRead(groupId: number) {
    const { status } = useSession();
    const utils = trpc.useContext();
    function resetGroupUnread(groupId: number) {
        utils.group.all.setData(undefined, (groups) =>
            groups?.map((group) =>
                group.id === groupId
                    ? {
                          ...group,
                          unread_messages: 0,
                      }
                    : group
            )
        );
    }

    const checkoutQuery = trpc.chat.checkout.useQuery(
        { groupId },
        {
            enabled: status === "authenticated",
            refetchOnWindowFocus: false,
            onSuccess: () => resetGroupUnread(groupId),
        }
    );

    return checkoutQuery.data != null
        ? new Date(checkoutQuery.data.last_read)
        : null;
}

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
            <Link
                href={`/chat/${group}/settings`}
                className={button({
                    color: "secondary",
                    className: "gap-2",
                })}
            >
                <GearIcon /> Settings
            </Link>
        ),
    }));

export default GroupChat;
