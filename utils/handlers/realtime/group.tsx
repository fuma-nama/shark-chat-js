import { channels } from "@/utils/ably/client";
import { useChannels } from "@/utils/ably/hooks";
import { trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";
import { useMemo } from "react";
import { useEventHandlers } from "../base";

export function GroupEventManager() {
    const { status, data } = useSession();
    const handlers = useEventHandlers();
    const utils = handlers.utils;

    const onEvent = channels.group.useCallback(
        ({ name, data: message }) => {
            if (name === "group_deleted") {
                return handlers.deleteGroup(message.id);
            }

            if (name === "group_updated") {
                return handlers.updateGroup(message);
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

        return groups.data.map((group) => channels.group.get([group.id]));
    }, [groups.data]);

    useChannels(channelList, onEvent);

    return <></>;
}
