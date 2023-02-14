import { z } from "zod";
import { InferChannelTypes } from "./types";

export const channels = {
    /**
     * Private channel for per user
     */
    private: {
        message_sent: z.object({
            message: z.string(),
        }),
        message_deleted: z.object({
            id: z.string(),
        }),
        group_created: z.strictObject({
            name: z.string(),
            icon_hash: z.number().nullable(),
            id: z.number(),
            owner_id: z.string(),
        }),
    },
    chat: {},
};

export type Channels = InferChannelTypes<typeof channels>;
