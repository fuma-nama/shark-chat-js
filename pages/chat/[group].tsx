import Avatar from "@/components/Avatar";
import { AppLayout } from "@/components/layout/app";
import { trpc } from "@/utils/trpc";
import { groupIcon } from "@/utils/media";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { NextPageWithLayout } from "../_app";
import { CldImage } from "next-cloudinary";
import { BookmarkIcon, ChatBubbleIcon } from "@radix-ui/react-icons";
import { GetServerSideProps } from "next";
import { useEffect } from "react";
import clsx from "clsx";
import { Message, User } from "@prisma/client";
import { Serialize } from "@/utils/types";
import useInfiniteScroll from "react-infinite-scroll-hook";
import React from "react";
import { useBottomScroll } from "@/utils/use-bottom-scroll";
import { Sendbar } from "@/components/chat/Sendbar";
import { useMessageEvents } from "@/utils/chat";
import { Spinner } from "@/components/Spinner";

type Props = {
    group: number;
};

const GroupChat: NextPageWithLayout<Props> = ({ group }) => {
    const { status } = useSession();
    const variables = {
        groupId: group,
        count: 30,
        cursorType: "before",
    } as const;

    const query = trpc.chat.messages.useInfiniteQuery(variables, {
        enabled: status === "authenticated",
        staleTime: Infinity,
        getPreviousPageParam: (messages) =>
            messages.length != 0
                ? messages[messages.length - 1].timestamp
                : null,
    });
    useMessageEvents(variables);

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

    const { handleRootScroll, scrollableRootRef } = useBottomScroll([pages]);

    useEffect(() => {
        rootRef(scrollableRootRef.current);
    }, [rootRef, scrollableRootRef]);

    return (
        <>
            <div
                className="flex flex-col flex-1 overflow-y-auto h-0 gap-3 mb-5"
                ref={scrollableRootRef}
                onScroll={handleRootScroll}
            >
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
                            <Message key={message.id} message={message} />
                        ))}
                    </div>
                ))}
            </div>
            <Sendbar group={group} />
        </>
    );
};

function Message({
    message,
}: {
    message: Serialize<Message & { author: User }>;
}) {
    return (
        <div className="p-3 rounded-xl bg-light-50 dark:bg-dark-800 flex flex-row gap-2">
            <Avatar
                src={message.author.image}
                fallback={message.author.name!!}
            />
            <div>
                <p className="font-semibold">{message.author.name}</p>
                <p>
                    {message.content}{" "}
                    {new Date(message.timestamp).toLocaleString()}
                </p>
            </div>
        </div>
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

export const getServerSideProps: GetServerSideProps<Props> = async (props) => {
    const { group } = props.query;

    return {
        props: {
            group: Number(group),
        },
    };
};

GroupChat.useLayout = (children) => {
    const router = useRouter();
    const { group } = router.query;
    const { status } = useSession();
    const info = trpc.group.info.useQuery(
        { groupId: Number(group) },
        { enabled: status === "authenticated" }
    );

    return (
        <AppLayout
            title="Group Chat"
            breadcrumb={[
                {
                    text:
                        info.data != null ? (
                            <div className="flex flex-row gap-2 items-center">
                                {info.data.icon_hash != null ? (
                                    <CldImage
                                        src={groupIcon.url(
                                            [info.data.id],
                                            info.data.icon_hash
                                        )}
                                        alt="icon"
                                        width="28"
                                        height="28"
                                        className="rounded-full"
                                    />
                                ) : (
                                    <ChatBubbleIcon className="w-7 h-7" />
                                )}
                                <span>{info.data.name}</span>
                            </div>
                        ) : (
                            <div className="w-28 h-5 rounded-lg bg-light-300 dark:bg-dark-700" />
                        ),
                    href: `/chat/${group}`,
                },
            ]}
        >
            {children}
        </AppLayout>
    );
};

export default GroupChat;
