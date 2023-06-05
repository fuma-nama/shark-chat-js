import { useMemo } from "react";
import { type RouterInput, trpc } from "@/utils/trpc";
import type { Group } from "@/drizzle/schema";
import type { Serialize } from "../types";
import type { GroupWithNotifications } from "@/server/schema/group";
import type { MessageType } from "@/server/schema/chat";
import Router from "next/router";
import { getGroupQuery } from "../variables";

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
                    groups != null ? [full_group, ...groups] : undefined
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
            deleteGroup: (groupId: number) => {
                const active =
                    Router.asPath.startsWith("/chat/") &&
                    getGroupQuery(Router).groupId === groupId;

                if (active) {
                    Router.push("/home");
                }

                utils.group.all.setData(undefined, (groups) =>
                    groups?.filter((g) => g.id !== groupId)
                );
            },
            setGroupUnread: (groupId: number, fn: (prev: number) => number) => {
                utils.group.all.setData(undefined, (groups) =>
                    groups?.map((group) => {
                        if (group.id === groupId) {
                            return {
                                ...group,
                                unread_messages: fn(group.unread_messages),
                            };
                        }

                        return group;
                    })
                );
            },
            addGroupMessage: (
                variables: RouterInput["chat"]["messages"],
                message: MessageType
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
