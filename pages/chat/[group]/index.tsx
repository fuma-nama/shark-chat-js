import { trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";
import Router, { useRouter } from "next/router";
import { NextPageWithLayout } from "../../_app";
import { BookmarkIcon, GearIcon } from "@radix-ui/react-icons";
import { Fragment, useEffect } from "react";
import clsx from "clsx";
import React from "react";
import {
    SendData,
    Sendbar,
    TypingStatus,
    useTypingStatus,
} from "@/components/chat/Sendbar";
import { Spinner } from "@/components/system/spinner";
import { GroupMessageItem } from "@/components/chat/GroupMessageItem";
import { Button, button } from "@/components/system/button";
import Link from "next/link";
import { useGroupLayout } from "@/components/layout/group";
import { UnreadSeparator, useChatView } from "@/components/chat/ChatView";
import { channels } from "@/utils/ably/client";
import { getGroupQuery, getMessageVariables } from "@/utils/variables";
import { useGroupMessage } from "@/utils/stores/chat";
import { LocalMessageItem } from "@/components/chat/LocalMessageItem";
import { useEventHandlers } from "@/utils/handlers/base";
import { uploadAttachment } from "@/utils/media/upload-attachment";
import { useMutation } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";

const GroupChat: NextPageWithLayout = () => {
    const group = getGroupQuery(useRouter()).groupId;
    const { status } = useSession();
    const variables = getMessageVariables(group);
    const lastRead = useLastRead(group);
    const [sending, remove] = useGroupMessage((s) => [
        s.sending[group],
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
                <div ref={sentryRef} className="flex flex-col m-auto">
                    <Spinner size="large" />
                </div>
            ) : query.isError ? (
                <>
                    <p>{query.error.message}</p>
                    <Button color="danger" onClick={() => query.refetch()}>
                        Retry
                    </Button>
                </>
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
            {sending?.map((message) => (
                <LocalMessageItem
                    key={message.nonce}
                    item={message}
                    onDelete={() => remove(group, message.nonce)}
                />
            ))}
        </div>
    );
};

function useLastRead(groupId: number) {
    const { status } = useSession();
    const handlers = useEventHandlers();

    const checkoutQuery = trpc.chat.checkout.useQuery(
        { groupId },
        {
            enabled: status === "authenticated",
            refetchOnWindowFocus: false,
            onSuccess: () => handlers.setGroupUnread(groupId, () => 0),
        }
    );

    return checkoutQuery.data?.last_read != null
        ? new Date(checkoutQuery.data.last_read)
        : null;
}

type SendMutationInput = SendData & { groupId: number; nonce: number };
function GroupSendbar() {
    const utils = trpc.useContext();
    const [add, addError] = useGroupMessage((s) => [
        s.addSending,
        s.errorSending,
    ]);
    const typeMutation = trpc.useContext().client.chat.type;
    const sendMutation = useMutation(
        async ({ attachments, ...data }: SendMutationInput) => {
            const uploads = attachments.map((file) =>
                uploadAttachment(utils, file)
            );

            await utils.client.chat.send.mutate({
                ...data,
                attachments: await Promise.all(uploads),
            });
        },
        {
            onError(error, { nonce, groupId }) {
                if (nonce == null) return;

                addError(
                    groupId,
                    nonce,
                    error instanceof TRPCClientError
                        ? error.message
                        : "Something went wrong"
                );
            },
        }
    );

    const onSend = (data: SendData) => {
        const { groupId } = getGroupQuery(Router);

        sendMutation.mutate({
            ...data,
            groupId,
            nonce: add(groupId, data).nonce,
        });
    };

    return (
        <Sendbar
            onSend={onSend}
            onType={() =>
                typeMutation.mutate({ groupId: getGroupQuery(Router).groupId })
            }
        >
            <TypingUsers />
        </Sendbar>
    );
}

function TypingUsers() {
    const { status, data: session } = useSession();
    const { groupId } = getGroupQuery(useRouter());
    const { typing, add } = useTypingStatus();

    channels.chat.typing.useChannel(
        [groupId],
        { enabled: status === "authenticated" },
        (message) => {
            if (message.data.user.id === session?.user.id) return;

            add(message.data.user);
        }
    );

    return <TypingStatus typing={typing} />;
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
    useGroupLayout({
        children,
        footer: <GroupSendbar />,
        items: (
            <Link
                href={{
                    pathname: "/chat/[group]/settings",
                    query: useRouter().query,
                }}
                className={button({
                    color: "secondary",
                    className: "gap-2",
                })}
            >
                <GearIcon /> Settings
            </Link>
        ),
    });

export default GroupChat;
