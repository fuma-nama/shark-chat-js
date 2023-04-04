import { channels } from "@/utils/ably";
import { useChannels } from "@/utils/ably/hooks";
import { trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";
import { useMemo } from "react";
import { useEventHandlers } from "../base";
import Router from "next/router";
import {
    getDirectMessageVariables as getDMVariables,
    getGroupQuery,
    getMessageVariables,
} from "@/utils/variables";

export function MessageEventManager() {
    const { status, data } = useSession();
    const handlers = useEventHandlers();
    const utils = handlers.utils;

    const onEvent = channels.chat.useCallback(
        (message) => {
            if (message.name === "typing") return;

            const variables = getMessageVariables(message.data.group_id);
            const active =
                Router.asPath.startsWith("/chat/") &&
                getGroupQuery(Router).groupId === message.data.group_id;

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

    const groups = trpc.group.all.useQuery(undefined, {
        enabled: status === "authenticated",
        staleTime: Infinity,
    });

    const channelList = useMemo(() => {
        if (groups.data == null) return [];

        return groups.data.map((group) => channels.chat.get([group.id]));
    }, [groups.data]);

    useChannels(channelList, onEvent);

    return <></>;
}

export function DirectMessageEventManager() {
    const { status, data } = useSession();
    const utils = trpc.useContext();

    const onEvent = channels.dm.useCallback(
        (message) => {
            if (message.name === "typing") return;

            const user =
                message.data.author_id === data!!.user.id
                    ? message.data.receiver_id
                    : message.data.author_id;
            const variables = getDMVariables(user);

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
        [utils.dm.messages]
    );

    const channelQuery = trpc.dm.channels.useQuery(undefined, {
        enabled: status === "authenticated",
        staleTime: Infinity,
    });

    const channelList = useMemo(() => {
        if (channelQuery.data == null || data == null) return [];

        return channelQuery.data.map((dm) =>
            channels.dm.get([dm.receiver_id, data.user.id])
        );
    }, [channelQuery.data, data]);

    useChannels(channelList, onEvent);

    return <></>;
}
function getGroupVariables(group_id: number) {
    throw new Error("Function not implemented.");
}
