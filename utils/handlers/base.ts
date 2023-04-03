import { useMemo } from "react";
import { type RouterInput, trpc } from "@/utils/trpc";
import type { Group } from "@prisma/client";
import type { Serialize } from "../types";
import type { GroupWithNotifications } from "@/server/schema/group";
import type { DirectMessageType, MessageType } from "@/server/schema/chat";

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
                utils.group.all.setData(undefined, (groups) =>
                    groups?.filter((g) => g.id !== groupId)
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
            onNewDirectMessage: (
                selfId: string,
                message: Serialize<DirectMessageType>
            ) => {
                const user =
                    message.receiver.id !== selfId
                        ? message.receiver
                        : message.author;
                const self =
                    message.receiver.id === selfId
                        ? message.receiver
                        : message.author;

                utils.dm.channels.setData(undefined, (channels) => {
                    if (channels == null) return channels;

                    const exists = channels.some(
                        (c) => c.receiver_id === user.id
                    );

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
                        ...channels,
                        {
                            author_id: self.id,
                            receiver_id: user.id,
                            receiver: user,
                            last_message: message.content,
                            unread_messages: 1,
                            last_read: JSON.stringify(timestamp),
                        },
                    ];
                });
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
