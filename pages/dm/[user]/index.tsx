import { Avatar } from "@/components/system/avatar";
import { RouterInput, trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { Fragment, useEffect } from "react";
import { SendData, Sendbar } from "@/components/chat/Sendbar";
import {
    TypingIndicator,
    useTypingStatus,
} from "@/components/chat/TypingIndicator";
import { Spinner } from "@/components/system/spinner";
import { DirectMessageItem } from "@/components/chat/DirectMessageItem";
import { skeleton } from "@/components/system/skeleton";
import { UnreadSeparator, useChatView } from "@/components/chat/ChatView";

import type { NextPageWithLayout } from "../../_app";
import { channels } from "@/utils/ably/client";
import {
    DirectMessageQuery,
    getDirectMessageVariables,
} from "@/utils/variables";
import { useDirectMessage } from "@/utils/stores/chat";
import { LocalMessageItem } from "@/components/chat/LocalMessageItem";
import { useMutation } from "@tanstack/react-query";
import { uploadAttachment } from "@/utils/media/upload-attachment";
import { useDirectMessageLayout } from "@/components/layout/dm";
import { Cross1Icon } from "@radix-ui/react-icons";
import { text } from "@/components/system/text";

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

    return checkoutQuery.data?.last_read != null
        ? new Date(checkoutQuery.data.last_read)
        : null;
}

type SendMutationInput = Omit<RouterInput["dm"]["send"], "attachment"> & {
    attachment: File | null;
};

function DirectMessageSendbar() {
    const { user } = useRouter().query as DirectMessageQuery;
    const utils = trpc.useContext();
    const [add, error, info, update] = useDirectMessage((s) => [
        s.addSending,
        s.errorSending,
        s.sendbar[user],
        s.updateSendbar,
    ]);
    const typeMutation = utils.client.dm.type;
    const sendMutation = useMutation(
        async (data: SendMutationInput) => {
            const attachment =
                data.attachment != null
                    ? await uploadAttachment(utils, data.attachment)
                    : undefined;

            utils.client.dm.send.mutate({
                ...data,
                attachment,
            });
        },
        {
            onError({ message }, { userId, nonce }) {
                if (nonce != null) {
                    error(userId, nonce, message);
                }
            },
        }
    );

    const onSend = (data: SendData) => {
        sendMutation.mutate({
            ...data,
            userId: user,
            reply: info.reply_to?.id ?? undefined,
            nonce: add(user, data).nonce,
        });

        update(user, {
            reply_to: undefined,
        });
    };

    return (
        <Sendbar
            onSend={onSend}
            onType={() =>
                typeMutation.mutate({
                    userId: user,
                })
            }
        >
            {info?.reply_to != null && (
                <div className="flex flex-row">
                    <p
                        className={text({
                            type: "secondary",
                            size: "sm",
                            className: "flex-1",
                        })}
                    >
                        Replying to{" "}
                        <b>{info.reply_to.author?.name ?? "Unknown User"}</b>
                    </p>
                    <button
                        className="text-muted-foreground"
                        onClick={() => update(user, { reply_to: undefined })}
                    >
                        <Cross1Icon />
                    </button>
                </div>
            )}

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

    return <TypingIndicator typing={typing} />;
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

DMPage.useLayout = (c) =>
    useDirectMessageLayout({
        children: c,
        footer: <DirectMessageSendbar />,
    });

export default DMPage;
