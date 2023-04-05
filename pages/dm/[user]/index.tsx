import { AppLayout } from "@/components/layout/app";
import { Avatar } from "@/components/system/avatar";
import { trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";
import Router, { useRouter } from "next/router";
import { Fragment, useEffect } from "react";
import {
    SendData,
    Sendbar,
    TypingStatus,
    useTypingStatus,
} from "@/components/chat/Sendbar";
import { Spinner } from "@/components/system/spinner";
import { DirectMessageItem } from "@/components/chat/DirectMessageItem";
import { skeleton } from "@/components/system/skeleton";
import { UnreadSeparator, useChatView } from "@/components/chat/ChatView";

import type { NextPageWithLayout } from "../../_app";
import { channels } from "@/utils/ably";
import {
    DirectMessageQuery,
    getDirectMessageVariables,
} from "@/utils/variables";
import { useDirectMessage } from "@/utils/stores/chat";
import { LocalMessageItem } from "@/components/chat/LocalMessageItem";
import { addNonce, removeNonce } from "@/utils/handlers/realtime/shared";

const DMPage: NextPageWithLayout = () => {
    const { user } = useRouter().query as DirectMessageQuery;
    const { status } = useSession();
    const variables = getDirectMessageVariables(user);

    const lastRead = useLastRead(user);
    const [sending, remove] = useDirectMessage((s) => [
        s.sending[user],
        s.removeSending,
    ]);
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
    }, [pages, sending, scrollToBottom]);

    return (
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
                                new Date(prev_message.timestamp) <= lastRead);

                        return (
                            <Fragment key={message.id}>
                                {newLine && <UnreadSeparator />}
                                <DirectMessageItem message={message} />
                            </Fragment>
                        );
                    })}
                {sending?.map((message) => (
                    <LocalMessageItem
                        key={message.nonce}
                        item={message}
                        onDelete={() => remove(user, message.nonce)}
                    />
                ))}
            </div>
        </div>
    );
};

function useLastRead(userId: string) {
    const { status } = useSession();
    const utils = trpc.useContext();

    const checkoutQuery = trpc.dm.checkout.useQuery(
        { userId },
        {
            enabled: status === "authenticated",
            refetchOnWindowFocus: false,
            onSuccess() {
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
            },
        }
    );

    return checkoutQuery.data != null
        ? new Date(checkoutQuery.data.last_read)
        : null;
}

function DirectMessageSendbar() {
    const [add, error] = useDirectMessage((s) => [
        s.addSending,
        s.errorSending,
    ]);
    const typeMutation = trpc.useContext().client.dm.type;
    const sendMutation = trpc.dm.send.useMutation({
        onMutate({ nonce }) {
            if (nonce != null) addNonce(nonce);
        },
        onError({ message }, { userId, nonce }) {
            if (nonce != null) {
                error(userId, nonce, message);
                removeNonce(nonce);
            }
        },
    });

    const onSend = ({ content }: SendData) => {
        const { user } = Router.query as DirectMessageQuery;

        const item = add(user, content);
        sendMutation.mutate({
            userId: user,
            message: content,
            nonce: item.nonce,
        });
    };

    return (
        <Sendbar
            isLoading={sendMutation.isLoading}
            onSend={onSend}
            onType={() =>
                typeMutation.mutate({
                    userId: (Router.query as DirectMessageQuery).user,
                })
            }
        >
            <TypingUsers />
        </Sendbar>
    );
}

function TypingUsers() {
    const { typing, add } = useTypingStatus();
    const { status, data } = useSession();
    const { user } = useRouter().query as DirectMessageQuery;

    channels.dm.typing.useChannel(
        [user ?? "", data?.user.id ?? ""],
        {
            enabled: status === "authenticated",
        },
        (message) => {
            if (message.data.user.id === data?.user.id) return;

            add(message.data.user);
        }
    );

    return <TypingStatus typing={typing} />;
}

function Welcome() {
    const { user } = useRouter().query as DirectMessageQuery;
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
    const { user } = useRouter().query as DirectMessageQuery;
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
            footer={<DirectMessageSendbar />}
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
