import { groupSchema } from "@/server/schema/group";
import { Message, User } from "@prisma/client";
import { z } from "zod";
import { a } from "./ably-builder";

export const channels = a.channels({
    /**
     * Private channel for per user
     */
    private: a.channel(([clientId]: [clientId: string]) => [clientId], {
        group_updated: a.event(groupSchema),
        group_created: a.event(groupSchema),
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
