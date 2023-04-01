import { groupSchema } from "@/server/schema/group";
import type { DirectMessageType, MessageType } from "@/server/schema/chat";
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

export const channels = a.channels({
    /**
     * Private channel for per user
     */
    private: a.channel(([clientId]: [clientId: string]) => [clientId], {
        group_updated: a.event(groupSchema),
        group_created: a.event(groupSchema),
        group_deleted: a.event(groupSchema.pick({ id: true })),
    }),
    dm: a.channel(
        (users: [user1: string, user2: string]) => {
            const [user1, user2] = dmKey(...users);

            return [`dm-${user1}-${user2}`];
        },
        {
            message_sent: a.event(z.custom<DirectMessageType>()),
            message_updated: a.event(
                z.custom<
                    Pick<
                        DirectMessageType,
                        "id" | "author_id" | "receiver_id" | "content"
                    >
                >()
            ),
            message_deleted: a.event(
                z.custom<
                    Pick<DirectMessageType, "id" | "author_id" | "receiver_id">
                >()
            ),
        }
    ),
    chat: a.channel(([group]: [groupId: number]) => [`${group}`], {
        message_sent: a.event(z.custom<MessageType>()),
        message_updated: a.event(
            z.custom<Pick<MessageType, "id" | "group_id" | "content">>()
        ),
        message_deleted: a.event(
            z.custom<Pick<MessageType, "id" | "group_id">>()
        ),
    }),
});
