import { channels } from "@/utils/ably/client";
import { useChannels } from "ably-builder/hooks";
import { RouterUtils, trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";
import { useMemo } from "react";
import { Serialize } from "shared/types";
import { Group } from "db/schema";
import { deleteGroup } from "./shared";

export function GroupEventManager() {
    const { status, data } = useSession();
    const utils = trpc.useContext();

    const onEvent = channels.group.useCallback(
        ({ name, data: message }) => {
            if (name === "group_deleted") {
                return deleteGroup(utils, message.id);
            }

            if (name === "group_updated") {
                return updateGroup(utils, message);
            }
        },
        [data, utils]
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

function updateGroup(utils: RouterUtils, group: Serialize<Group>) {
    utils.group.info.setData({ groupId: group.id }, group);
    utils.group.all.setData(undefined, (groups) =>
        groups?.map((g) => (g.id === group.id ? { ...g, ...group } : g))
    );
}
