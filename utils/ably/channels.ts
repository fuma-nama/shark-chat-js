import { Types } from "ably";
import { z, ZodType } from "zod";
import { InferChannelTypes, ParsedMessage, TypedChannelPromise } from "./types";

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
    },
    chat: {},
};

export type Channels = InferChannelTypes<typeof channels>;

export function publishMessage<
    Channel extends Types.RealtimeChannelPromise,
    C extends Channel extends TypedChannelPromise<infer C> ? C : never,
    E extends keyof Channels[C]
>(channel: Channel, event: E, data: Channels[C][E]) {
    channel.publish(event as string, data);
}

export function parseMessage<C extends keyof Channels>(
    raw: Types.Message,
    channel: C
): ParsedMessage<C> {
    const event = raw.name as keyof Channels[C];
    const parser = (channels[channel] as unknown as Channels[C])[event];

    if (parser instanceof ZodType) {
        return {
            event: event,
            data: parser.parse(raw.data),
        } as any;
    } else {
        return {
            event: event,
            data: raw.data,
        } as any;
    }
}
