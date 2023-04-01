import { channels } from "@/utils/ably";
import { assertConfiguration } from "@ably-labs/react-hooks";
import { useSession } from "next-auth/react";
import { useCallback } from "react";
import { useEventHandlers } from "../base";
import { useMessageEventManager } from "./chat";

export function useAblyHandlers() {
    const ably = assertConfiguration();
    const { data, status } = useSession();
    const handlers = useEventHandlers();

    useMessageEventManager();
    channels.private.useChannel(
        [data?.user?.id ?? ""],
        {
            enabled: status === "authenticated",
        },
        useCallback(
            (message) => {
                if (ably.connection.id === message.connectionId) return;

                switch (message.name) {
                    case "group_created": {
                        handlers.createGroup(message.data);
                    }
                    case "group_updated": {
                        handlers.updateGroup(message.data);
                    }
                    case "group_deleted": {
                        handlers.deleteGroup(message.data.id);
                    }
                }
            },
            [ably.connection.id, handlers]
        )
    );
}
