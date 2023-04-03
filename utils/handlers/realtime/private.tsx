import { channels } from "@/utils/ably";
import { assertConfiguration } from "@ably-labs/react-hooks";
import { useSession } from "next-auth/react";
import { useEventHandlers } from "../base";
import Router from "next/router";
import {
    Params as DMParams,
    getVariables as getDMVariables,
} from "@/pages/dm/[user]";

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
                    handlers.onNewDirectMessage(data.user.id, message.data);
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
