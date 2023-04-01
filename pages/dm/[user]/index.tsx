import { AppLayout } from "@/components/layout/app";
import { Avatar } from "@/components/system/avatar";
import { trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { Fragment, useEffect, useMemo } from "react";
import { Sendbar } from "@/components/chat/Sendbar";
import { Spinner } from "@/components/system/spinner";
import { DirectMessageItem } from "@/components/chat/DirectMessageItem";
import { skeleton } from "@/components/system/skeleton";
import {
    ChatViewLayout,
    UnreadSeparator,
    useChatView,
} from "@/components/chat/ChatView";

import type { NextPageWithLayout } from "../../_app";

export type Params = {
    user: string;
};

export function getVariables(userId: string) {
    return {
        userId,
        count: 30,
        cursorType: "before",
    } as const;
}

const DMPage: NextPageWithLayout = () => {
    const { user } = useRouter().query as Params;
    const { status } = useSession();
    const variables = useMemo(() => getVariables(user), [user]);

    const lastRead = useLastRead(user);
    const query = trpc.dm.messages.useInfiniteQuery(variables, {
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
                <div className="flex flex-col gap-3">
                    {pages
                        ?.flatMap((messages) => [...messages].reverse())
                        .map((message, i, arr) => {
                            const prev_message = i > 0 ? arr[i - 1] : null;
                            const newLine =
                                lastRead != null &&
                                lastRead < new Date(message.timestamp) &&
                                (prev_message == null ||
                                    new Date(prev_message.timestamp) <=
                                        lastRead);

                            return (
                                <Fragment key={message.id}>
                                    {newLine && <UnreadSeparator />}
                                    <DirectMessageItem message={message} />
                                </Fragment>
                            );
                        })}
                </div>
            </div>
            <DMSendbar />
        </>
    );
};

function useLastRead(userId: string) {
    const { status } = useSession();
    const utils = trpc.useContext();

    function onSuccess() {
        utils.dm.channels.setData(undefined, (channels) =>
            channels?.map((dm) =>
                dm.receiver_id === userId
                    ? {
                          ...dm,
                          unread_messages: 0,
                      }
                    : dm
            )
        );
    }

    const checkoutQuery = trpc.dm.checkout.useQuery(
        { userId },
        {
            enabled: status === "authenticated",
            refetchOnWindowFocus: false,
            onSuccess,
        }
    );

    return checkoutQuery.data != null
        ? new Date(checkoutQuery.data.last_read)
        : null;
}

function DMSendbar() {
    const { user } = useRouter().query as Params;
    const sendMutation = trpc.dm.send.useMutation();

    return (
        <Sendbar
            isLoading={sendMutation.isLoading}
            onSend={({ content }) =>
                sendMutation.mutateAsync({
                    userId: user,
                    message: content,
                })
            }
        />
    );
}

function Welcome() {
    const { user } = useRouter().query as Params;
    const { status } = useSession();
    const query = trpc.dm.info.useQuery(
        { userId: user },
        { enabled: status === "authenticated" }
    );

    const data = query.data;
    return (
        <div className="flex flex-col gap-3 mb-10">
            <Avatar src={data?.image} fallback={data?.name} size="large" />
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                {data?.name ?? (
                    <span
                        className={skeleton({ className: "w-40 h-[40px]" })}
                    />
                )}
            </h1>
            <p className="text-accent-800 dark:text-accent-600 text-lg">
                Start your conversations with{" "}
                {data?.name ?? (
                    <span
                        className={skeleton({
                            className: "align-middle",
                        })}
                    />
                )}
            </p>
        </div>
    );
}

function BreadcrumbItem() {
    const { user } = useRouter().query as Params;
    const { status } = useSession();
    const query = trpc.dm.info.useQuery(
        { userId: user },
        { enabled: status === "authenticated" }
    );

    return query.data == null ? (
        <div className={skeleton()} />
    ) : (
        <div className="flex flex-row gap-2 items-center">
            <Avatar
                src={query.data.image}
                fallback={query.data.name}
                size="small"
            />
            <span>{query.data.name}</span>
        </div>
    );
}

DMPage.useLayout = (c) => {
    const router = useRouter();

    return (
        <AppLayout
            layout={ChatViewLayout}
            breadcrumb={[
                {
                    text: <BreadcrumbItem />,
                    href: router.asPath,
                },
            ]}
        >
            {c}
        </AppLayout>
    );
};

export default DMPage;
