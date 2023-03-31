import { useMemo } from "react";
import { type RouterInput, trpc } from "@/utils/trpc";
import type { Group } from "@prisma/client";
import type { Serialize } from "../types";
import type { GroupWithNotifications } from "@/server/schema/group";
import type { MessageType } from "@/server/schema/chat";

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
            addGroupMessage: (
                variables: RouterInput["chat"]["messages"],
                message: Serialize<MessageType>
            ) => {
                utils.chat.messages.setInfiniteData(variables, (prev) => {
                    if (prev == null) return prev;

                    return {
                        ...prev,
                        pages: [...prev.pages, [message]],
                    };
                });
            },
        }),
        [utils]
    );
}
