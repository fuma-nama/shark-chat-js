import { useMemo } from "react";
import { trpc } from "@/utils/trpc";
import { Group } from "@prisma/client";
import { Serialize } from "../types";
import { GroupWithNotifications } from "@/server/schema/group";

export function useEventHandlers() {
    const utils = trpc.useContext();

    return useMemo(
        () => ({
            utils,
            createGroup: (group: Serialize<Group>) => {
                const full_group: GroupWithNotifications = {
                    ...group,
                    unread_messages: 0,
                };

                utils.group.info.setData({ groupId: group.id }, group);
                utils.group.all.setData(undefined, (groups) =>
                    groups != null ? [...groups, full_group] : undefined
                );
            },
            updateGroup: (group: Serialize<Group>) => {
                utils.group.info.setData({ groupId: group.id }, group);
                utils.group.all.setData(undefined, (groups) =>
                    groups?.map((g) =>
                        g.id === group.id
                            ? { ...group, unread_messages: g.unread_messages }
                            : g
                    )
                );
            },
            addGroupUnread: (groupId: number) => {
                utils.group.all.setData(undefined, (groups) =>
                    groups?.map((group) => {
                        if (group.id === groupId) {
                            return {
                                ...group,
                                unread_messages: group.unread_messages + 1,
                            };
                        }

                        return group;
                    })
                );
            },
        }),
        [utils]
    );
}
