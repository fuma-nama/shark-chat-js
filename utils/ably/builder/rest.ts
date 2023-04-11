import type { Types } from "ably";
import type {
    Channel,
    ChannelBuilder,
    EventBuilderRecord,
    EventsRecord,
    Event,
    Schema,
    SchemaToCaller,
} from ".";

function buildRestChannel(
    ably: Types.RestPromise,
    channel: ChannelBuilder<unknown, EventBuilderRecord>,
    channel_name: string
): Channel<unknown, EventsRecord<unknown, false>, false> {
    const events = Object.entries(channel.events).map(([event_name, event]) => {
        const e: Event<unknown, unknown, false> = {
            parse: event.parse,
            publish(args, data) {
                const channel = c.get(args);

                return channel.publish(event_name, data);
            },
        };

        return [event_name, e];
    });

    const c: Channel<unknown, EventsRecord<unknown, false>, false> = {
        channelName(args) {
            return [channel_name, ...channel.data(args)].join(":");
        },
        get(args) {
            return ably.channels.get(this.channelName(args));
        },
        ...Object.fromEntries(events),
    };

    return c;
}

export function rest<S extends Schema>(
    ably: Types.RestPromise,
    schema: S
): SchemaToCaller<S, false> {
    const caller = Object.entries(schema).map(([k, channel]) => {
        return [k, buildRestChannel(ably, channel, k)];
    });

    return Object.fromEntries(caller);
}
