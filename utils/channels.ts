import { Types } from "ably";
import { z, ZodType } from "zod";
import { InferChannelTypes, ParsedMessage } from "./ably-types";

export const channels = {
    private: {
        message_sent: z.object({
            message: z.string(),
        }),
        message_deleted: z.object({
            id: z.string(),
        }),
    },
};

export type Channels = InferChannelTypes<typeof channels>;

/**
 * Private channel for per user
 */
export function privateChannel(clientId: string) {
    return `private:${clientId}`;
}

export function parseMessage(
    raw: Types.Message,
    channel: keyof Channels
): ParsedMessage<typeof channel> {
    const event = raw.name as keyof Channels[typeof channel];
    const parser = channels[channel][event];

    if (parser instanceof ZodType) {
        return {
            event: event,
            data: parser.parse(raw.data) as any,
        };
    } else {
        return {
            event,
            data: raw.data,
        };
    }
}
