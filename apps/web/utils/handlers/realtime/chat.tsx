import { channels } from "@/utils/ably/client";
import { useChannels } from "ably-builder/hooks";
import { RouterInput, RouterUtils, trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";
import { useMemo } from "react";
import Router from "next/router";
import { getMessageVariables } from "@/utils/variables";
import { removeNonce, setChannelUnread } from "./shared";
import { useMessageStore } from "@/utils/stores/chat";
import { MessageType } from "@/utils/types";

export function MessageEventManager() {
    const { status, data } = useSession();
    const utils = trpc.useContext();

    const onEvent = channels.chat.useCallback(
        ({ name, data: message }) => {
            if (name === "typing") return;

            const variables = getMessageVariables(message.channel_id);
            const active =
                Router.query.channel === message.channel_id ||
                `g_${Router.query.group}` === message.channel_id;

            if (name === "message_sent") {
                const self = message.author_id === data?.user.id;

                if (active || self) {
                    utils.chat.checkout.setData(
                        { channelId: message.channel_id },
                        { last_read: message.timestamp }
                    );
                } else {
                    setChannelUnread(
                        utils,
                        message.channel_id,
                        (prev) => prev + 1
                    );
                }

                if (active && !self) {
                    utils.client.chat.read.mutate({
                        channelId: message.channel_id,
                    });
                }

                if (message.nonce != null && removeNonce(message.nonce)) {
                    useMessageStore
                        .getState()
                        .removeSending(message.channel_id, message.nonce);
                }

                return addGroupMessage(utils, variables, message);
            }

            if (name === "message_updated") {
                return utils.chat.messages.setInfiniteData(
                    variables,
                    (prev) => {
                        if (prev == null) return prev;

                        const pages = prev.pages.map((page) =>
                            page.map((msg) => {
                                if (msg.id === message.id) {
                                    return {
                                        ...msg,
                                        content: message.content,
                                    };
                                }

                                return msg;
                            })
                        );

                        return {
                            ...prev,
                            pages,
                        };
                    }
                );
            }

            if (name === "message_deleted") {
                return utils.chat.messages.setInfiniteData(
                    variables,
                    (prev) => {
                        if (prev == null) return prev;

                        const pages = prev.pages.map((page) => {
                            return page.filter((msg) => msg.id !== message.id);
                        });

                        return {
                            ...prev,
                            pages,
                        };
                    }
                );
            }
        },
        [data, utils]
    );

    const groups = trpc.group.all.useQuery(undefined, {
        enabled: status === "authenticated",
        staleTime: Infinity,
    });

    const dm = trpc.dm.channels.useQuery(undefined, {
        enabled: status === "authenticated",
        staleTime: Infinity,
    });

    const channelList = useMemo(() => {
        return [
            ...(groups.data?.map((group) =>
                channels.chat.get([`g_${group.id}`])
            ) ?? []),
            ...(dm.data?.map((channel) => channels.chat.get([channel.id])) ??
                []),
        ];
    }, [groups.data, dm.data]);

    useChannels(channelList, onEvent);

    return <></>;
}

function addGroupMessage(
    utils: RouterUtils,
    variables: RouterInput["chat"]["messages"],
    message: MessageType
) {
    utils.chat.messages.setInfiniteData(variables, (prev) => {
        if (prev == null) return prev;

        return {
            ...prev,
            pages: [...prev.pages, [message]],
        };
    });
}
