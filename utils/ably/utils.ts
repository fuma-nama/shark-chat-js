import { Types } from "ably";
import { AnyChannel, Channel, Event } from "./ably-ts";

export function getChannel<Args>(
    ably: Types.RealtimePromise,
    channel: AnyChannel<Args>,
    args: Args
): Types.RealtimeChannelPromise {
    const name = channel.channelName(args);

    return ably.channels.get(name);
}

export function publishMessage<Channel extends Types.RealtimeChannelPromise, T>(
    channel: Channel,
    event: Event<any, T>,
    data: T
) {
    return channel.publish(event._def.name!!, data);
}
