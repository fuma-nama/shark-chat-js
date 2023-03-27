import {
    DirectMessageType,
    groupSchema,
    MessageType,
} from "@/server/schema/group";
import { z } from "zod";
import { a } from "./ably-builder";

function dmKey(user1: string, user2: string): [user1: string, user2: string] {
    function getHash(s: string): number {
        let hash = 0,
            i,
            chr;
        if (s.length === 0) return hash;
        for (i = 0; i < s.length; i++) {
            chr = s.charCodeAt(i);
            hash = (hash << 5) - hash + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }

    if (getHash(user1) > getHash(user2)) {
        return [user1, user2];
    } else {
        return [user2, user1];
    }
}

export type Channels = typeof channels;

export const channels = a.channels({
    /**
     * Private channel for per user
     */
    private: a.channel(([clientId]: [clientId: string]) => [clientId], {
        group_updated: a.event(groupSchema),
        group_created: a.event(groupSchema),
    }),
    dm: a.channel(
        (users: [user1: string, user2: string]) => {
            const [user1, user2] = dmKey(...users);

            return [`dm-${user1}-${user2}`];
        },
        {
            message_sent: a.event(z.custom<DirectMessageType>()),
            message_updated: a.event(
                z.object({
                    id: z.number(),
                    content: z.string(),
                })
            ),
            message_deleted: a.event(
                z.object({
                    id: z.number(),
                })
            ),
        }
    ),
    chat: a.channel(([group]: [groupId: number]) => [`${group}`], {
        message_sent: a.event(z.custom<MessageType>()),
        message_updated: a.event(
            z.object({
                id: z.number(),
                content: z.string(),
            })
        ),
        message_deleted: a.event(
            z.object({
                id: z.number(),
            })
        ),
    }),
});
