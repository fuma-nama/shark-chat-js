import { Message, User } from "@prisma/client";
import { z } from "zod";
import { a } from "./ably-ts";

export const channels = a.channels({
    /**
     * Private channel for per user
     */
    private: a.channel(([clientId]: [clientId: string]) => [clientId], {
        group_created: a.event(
            z.strictObject({
                name: z.string(),
                icon_hash: z.number().nullable(),
                id: z.number(),
                owner_id: z.string(),
            })
        ),
    }),
    chat: a.channel(([group]: [groupId: number]) => [`${group}`], {
        message_sent: a.event(
            z.custom<
                Message & {
                    author: User;
                }
            >()
        ),
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
