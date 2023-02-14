import { Types } from "ably";
import { ZodType } from "zod";
import { Channels, channels } from "./channels";
import { TypedChannelPromise, ParsedMessage } from "./types";

export function getChannel<C extends keyof Channels>(
    ably: Types.RealtimePromise,
    ...names: [root: C, ...data: string[]]
): TypedChannelPromise<C> {
    const name = names.join(":");

    return ably.channels.get(name);
}

export function publishMessage<
    Channel extends Types.RealtimeChannelPromise,
    C extends Channel extends TypedChannelPromise<infer C> ? C : never,
    E extends keyof Channels[C]
>(channel: Channel, event: E, data: Channels[C][E]) {
    return channel.publish(event as string, data);
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
