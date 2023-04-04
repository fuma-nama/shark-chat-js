import { channels } from "@/utils/ably";
import { assertConfiguration } from "@ably-labs/react-hooks";
import { useSession } from "next-auth/react";
import { useEventHandlers } from "../base";
import Router from "next/router";
import {
    DirectMessageQuery as DMParams,
    getDirectMessageVariables as getDMVariables,
} from "@/utils/variables";
import { DirectMessageWithReceiver } from "@/server/schema/chat";
import { Serialize } from "@/utils/types";
import type { CreateReactUtilsProxy } from "@trpc/react-query/shared";
import type { AppRouter } from "@/server/routers/_app";

export function PrivateEventManager() {
    const ably = assertConfiguration();
    const { data, status } = useSession();
    const handlers = useEventHandlers();

    const onEvent = channels.private.useCallback(
        (message) => {
            const utils = handlers.utils;
            const isSelf = ably.connection.id === message.connectionId;

            if (message.name === "group_created" && !isSelf) {
                return handlers.createGroup(message.data);
            }

            if (message.name === "group_updated" && !isSelf) {
                return handlers.updateGroup(message.data);
            }

            if (message.name === "group_deleted" && !isSelf) {
                return handlers.deleteGroup(message.data.id);
            }

            if (message.name === "message_sent" && data != null) {
                const user =
                    message.data.author_id === data.user.id
                        ? message.data.receiver_id
                        : message.data.author_id;
                const variables = getDMVariables(user);
                const active =
                    Router.asPath.startsWith("/dm/") &&
                    (Router.query as DMParams).user === user;

                if (active) {
                    utils.dm.checkout.setData(
                        { userId: user },
                        { last_read: message.data.timestamp }
                    );
                }

                if (active && message.data.author_id !== data!!.user.id) {
                    utils.client.dm.read.mutate({
                        userId: user,
                    });
                }

                if (!active) {
                    onNewDirectMessage(utils, data.user.id, message.data);
                }

                return utils.dm.messages.setInfiniteData(variables, (prev) => {
                    if (prev == null) return prev;

                    return {
                        ...prev,
                        pages: [...prev.pages, [message.data]],
                    };
                });
            }
        },
        [ably.connection.id, data, handlers]
    );

    channels.private.useChannel(
        [data?.user?.id ?? ""],
        {
            enabled: status === "authenticated",
        },
        onEvent
    );

    return <></>;
}

function onNewDirectMessage(
    utils: CreateReactUtilsProxy<AppRouter, unknown>,
    selfId: string,
    message: Serialize<DirectMessageWithReceiver>
) {
    const [user, self] =
        message.receiver.id === selfId
            ? [message.author, message.receiver]
            : [message.receiver, message.author];

    utils.dm.channels.setData(undefined, (channels) => {
        if (channels == null) return channels;

        const exists = channels.some((c) => c.receiver_id === user.id);

        if (exists) {
            return channels.map((dm) => {
                if (dm.receiver_id === user.id) {
                    return {
                        ...dm,
                        last_message: message.content,
                        unread_messages: dm.unread_messages + 1,
                    };
                }

                return dm;
            });
        }

        const timestamp = new Date(message.timestamp);
        timestamp.setTime(timestamp.getTime() - 1);

        return [
            {
                author_id: self.id,
                receiver_id: user.id,
                receiver: user,
                last_message: message.content,
                unread_messages: 1,
                last_read: JSON.stringify(timestamp),
            },
            ...channels,
        ];
    });
}
