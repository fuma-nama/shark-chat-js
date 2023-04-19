import { groupSchema } from "@/server/schema/group";
import type {
    DirectMessageType,
    DirectMessageEvent,
    MessageType,
    UserInfo,
} from "@/server/schema/chat";
import { z } from "zod";
import { a } from "./builder";
import { getHash } from "../get-hash";

function dmKey(user1: string, user2: string): [user1: string, user2: string] {
    if (getHash(user1) > getHash(user2)) {
        return [user1, user2];
    } else {
        return [user2, user1];
    }
}

export const schema = {
    /**
     * Private channel for per user
     */
    private: a.channel(([clientId]: [clientId: string]) => [clientId], {
        group_created: a.event(groupSchema),
        group_removed: a.event(groupSchema.pick({ id: true })),
        message_sent: a.event(z.custom<DirectMessageEvent>()),
        close_dm: a.event(
            z.object({
                userId: z.string(),
            })
        ),
    }),
    dm: a.channel(
        (users: [user1: string, user2: string]) => {
            const [user1, user2] = dmKey(...users);

            return [`dm-${user1}-${user2}`];
        },
        {
            typing: a.event(z.object({ user: z.custom<UserInfo>() })),
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
        typing: a.event(z.object({ user: z.custom<UserInfo>() })),
        message_sent: a.event(z.custom<MessageType & { nonce?: number }>()),
        message_updated: a.event(
            z.custom<Pick<MessageType, "id" | "group_id" | "content">>()
        ),
        message_deleted: a.event(
            z.custom<Pick<MessageType, "id" | "group_id">>()
        ),
        group_updated: a.event(groupSchema),
        group_deleted: a.event(groupSchema.pick({ id: true })),
    }),
};
