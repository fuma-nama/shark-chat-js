import { channels } from "@/utils/ably/client";
import { assertConfiguration } from "@ably-labs/react-hooks";
import { useSession } from "next-auth/react";
import { useEventHandlers } from "../base";

export function PrivateEventManager() {
    const ably = assertConfiguration();
    const { data, status } = useSession();
    const handlers = useEventHandlers();

    const onEvent = channels.private.useCallback(
        ({ data: message, name, connectionId }) => {
            const isSelf = ably.connection.id === connectionId;

            if (name === "group_created" && !isSelf) {
                return handlers.createGroup(message);
            }

            if (name === "group_removed" && !isSelf) {
                return handlers.deleteGroup(message.id);
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
