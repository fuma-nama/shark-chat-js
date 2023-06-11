import { Group } from "db/schema";
import { GroupWithNotifications } from "@/utils/types";
import { RouterUtils } from "@/utils/trpc";
import { Serialize } from "shared/types";
import { getGroupQuery } from "@/utils/variables";
import Router from "next/router";

export const nonces = new Set<number>();

export function addNonce(nonce: number) {
    return nonces.add(nonce);
}

export function removeNonce(nonce: number) {
    return nonces.delete(nonce);
}

export function createGroup(utils: RouterUtils, group: Serialize<Group>) {
    const full_group: GroupWithNotifications = {
        ...group,
        last_message: null,
        unread_messages: 0,
    };

    utils.group.info.setData({ groupId: group.id }, group);
    utils.group.all.setData(undefined, (groups) =>
        groups != null ? [full_group, ...groups] : undefined
    );
}

export function deleteGroup(utils: RouterUtils, groupId: number) {
    const active =
        Router.asPath.startsWith("/chat/") &&
        getGroupQuery(Router).groupId === groupId;

    if (active) {
        Router.push("/home");
    }

    utils.group.all.setData(undefined, (groups) =>
        groups?.filter((g) => g.id !== groupId)
    );
}

export function setChannelUnread(
    utils: RouterUtils,
    channelId: string,
    fn: (prev: number) => number
) {
    utils.dm.channels.setData(undefined, (prev) =>
        prev?.map((channel) => {
            if (channel.id === channelId) {
                return {
                    ...channel,
                    unread_messages: fn(channel.unread_messages),
                };
            }

            return channel;
        })
    );

    utils.group.all.setData(undefined, (groups) =>
        groups?.map((group) => {
            if (group.channel_id === channelId) {
                return {
                    ...group,
                    unread_messages: fn(group.unread_messages),
                };
            }

            return group;
        })
    );
}
