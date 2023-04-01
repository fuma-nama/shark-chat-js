import { channels } from "@/utils/ably";
import { RouterInput, trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";
import { useEffect, useMemo } from "react";
import { useEventHandlers } from "../base";
import { getQuery, getVariables } from "@/pages/chat/[group]";
import { assertConfiguration } from "@ably-labs/react-hooks";
import Router from "next/router";

export function useMessageEventManager() {
    const { status, data } = useSession();
    const handlers = useEventHandlers();
    const utils = handlers.utils;

    const onEvent = channels.chat.useCallback(
        (message) => {
            const variables = getVariables(message.data.group_id);
            const active =
                Router.asPath.startsWith("/chat/") &&
                getQuery(Router).groupId === message.data.group_id;

            if (message.name === "message_sent") {
                if (active) {
                    utils.chat.checkout.setData(
                        { groupId: message.data.group_id },
                        { last_read: message.data.timestamp }
                    );
                }

                if (active && message.data.author_id !== data?.user.id) {
                    utils.client.chat.read.mutate({
                        groupId: message.data.group_id,
                    });
                }

                if (!active) {
                    handlers.addGroupUnread(message.data.group_id);
                }

                return handlers.addGroupMessage(variables, message.data);
            }

            if (message.name === "message_updated") {
                return utils.chat.messages.setInfiniteData(
                    variables,
                    (prev) => {
                        if (prev == null) return prev;

                        const pages = prev.pages.map((page) =>
                            page.map((msg) => {
                                if (msg.id === message.data.id) {
                                    return {
                                        ...msg,
                                        content: message.data.content,
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

            if (message.name === "message_deleted") {
                return utils.chat.messages.setInfiniteData(
                    variables,
                    (prev) => {
                        if (prev == null) return prev;

                        const pages = prev.pages.map((page) => {
                            return page.filter(
                                (msg) => msg.id !== message.data.id
                            );
                        });

                        return {
                            ...prev,
                            pages,
                        };
                    }
                );
            }
        },
        [data, utils, handlers]
    );

    const ably = assertConfiguration();
    const groups = trpc.group.all.useQuery(undefined, {
        enabled: status === "authenticated",
    });

    const channelList = useMemo(() => {
        if (groups.data == null) return [];

        return groups.data.map((group) =>
            ably.channels.get(channels.chat.channelName([group.id]))
        );
    }, [groups.data, ably]);

    useEffect(() => {
        for (const channel of channelList) {
            channel.subscribe(onEvent);
        }

        return () => {
            for (const channel of channelList) {
                channel.unsubscribe(onEvent);
            }
        };
    }, [channelList, onEvent]);
}

export function useDirectMessageHandlers(
    variables: RouterInput["dm"]["messages"]
) {
    const { status, data } = useSession();
    const utils = trpc.useContext();

    const onEvent = channels.dm.useCallback(
        (message) => {
            if (message.name === "message_sent") {
                return utils.dm.messages.setInfiniteData(variables, (prev) => {
                    if (prev == null) return prev;

                    return {
                        ...prev,
                        pages: [...prev.pages, [message.data]],
                    };
                });
            }

            if (message.name === "message_updated") {
                return utils.dm.messages.setInfiniteData(variables, (prev) => {
                    if (prev == null) return prev;

                    const pages = prev.pages.map((page) =>
                        page.map((msg) => {
                            if (msg.id === message.data.id) {
                                return {
                                    ...msg,
                                    content: message.data.content,
                                };
                            }

                            return msg;
                        })
                    );

                    return {
                        ...prev,
                        pages,
                    };
                });
            }

            if (message.name === "message_deleted") {
                return utils.dm.messages.setInfiniteData(variables, (prev) => {
                    if (prev == null) return prev;

                    const pages = prev.pages.map((page) => {
                        return page.filter((msg) => msg.id !== message.data.id);
                    });
                    return {
                        ...prev,
                        pages,
                    };
                });
            }
        },
        [utils.dm.messages, variables]
    );

    channels.dm.useChannel(
        [variables.userId, data?.user?.id ?? ""],
        {
            enabled: status === "authenticated",
        },
        onEvent
    );
}
