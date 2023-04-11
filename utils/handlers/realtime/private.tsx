import { channels } from "@/utils/ably/client";
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
import { useDirectMessage } from "@/utils/stores/chat";
import { removeNonce } from "./shared";

export function PrivateEventManager() {
    const ably = assertConfiguration();
    const { data, status } = useSession();
    const handlers = useEventHandlers();

    const onEvent = channels.private.useCallback(
        ({ data: message, name, connectionId }) => {
            const utils = handlers.utils;
            const isSelf = ably.connection.id === connectionId;

            if (name === "group_created" && !isSelf) {
                return handlers.createGroup(message);
            }

            if (name === "group_removed" && !isSelf) {
                return handlers.deleteGroup(message.id);
            }

            if (name === "message_sent" && data != null) {
                const user =
                    message.author_id === data.user.id
                        ? message.receiver_id
                        : message.author_id;
                const self = message.author_id === data!!.user.id;
                const variables = getDMVariables(user);
                const active =
                    Router.asPath.startsWith("/dm/") &&
                    (Router.query as DMParams).user === user;

                if (active || self) {
                    utils.dm.checkout.setData(
                        { userId: user },
                        { last_read: message.timestamp }
                    );
                    updateChannel(utils, data.user.id, message, 0);
                } else {
                    updateChannel(utils, data.user.id, message, 1);
                }

                if (active && !self) {
                    utils.client.dm.read.mutate({
                        userId: user,
                    });
                }

                if (message.nonce != null && removeNonce(message.nonce)) {
                    useDirectMessage
                        .getState()
                        .removeSending(user, message.nonce);
                }

                return utils.dm.messages.setInfiniteData(variables, (prev) => {
                    if (prev == null) return prev;

                    return {
                        ...prev,
                        pages: [...prev.pages, [message]],
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

function updateChannel(
    utils: CreateReactUtilsProxy<AppRouter, unknown>,
    selfId: string,
    message: Serialize<DirectMessageWithReceiver>,
    count: number
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
                        unread_messages: dm.unread_messages + count,
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
                unread_messages: count,
                last_read: JSON.stringify(timestamp),
            },
            ...channels,
        ];
    });
}
