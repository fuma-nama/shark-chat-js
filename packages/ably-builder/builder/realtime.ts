import { useCallback } from "react";
import type { Types } from "ably";
import type {
    Event,
    Channel,
    EventsRecord,
    ChannelBuilder,
    EventBuilderRecord,
    Schema,
    SchemaToCaller,
} from ".";
import { useChannel } from "../hooks";

export function realtime<S extends Schema>(
    ably: Types.RealtimePromise,
    schema: S
): SchemaToCaller<S, true> {
    const caller = Object.entries(schema).map(([k, channel]) => {
        return [k, buildRealtimeChannel(ably, channel, k)];
    });

    return Object.fromEntries(caller);
}

function buildRealtimeChannel(
    ably: Types.RealtimePromise,
    channel: ChannelBuilder<unknown, EventBuilderRecord>,
    channel_name: string
): Channel<unknown, EventsRecord<unknown, true>, true> {
    const events = Object.entries(channel.events).map(([event_name, event]) => {
        const e: Event<unknown, unknown, true> = {
            parse: event.parse,
            publish(args, data) {
                return c.get(args).publish(event_name, data);
            },
            useChannel(args, params, callback) {
                const channel = c.channelName(args);

                return useChannel(
                    {
                        channelName: channel,
                        events: [event_name],
                        ...params,
                    },
                    useCallback(
                        (raw) => {
                            return callback({
                                ...raw,
                                data: this.parse(raw) as never,
                            });
                        },
                        [callback]
                    )
                );
            },
        };

        return [event_name, e];
    });

    const c: Channel<unknown, EventsRecord<unknown, true>, true> = {
        channelName(args) {
            return [channel_name, ...channel.data(args)].join(":");
        },
        get(args) {
            return ably.channels.get(this.channelName(args));
        },
        useChannel(args, params, callback) {
            return useChannel(
                {
                    channelName: this.channelName(args),
                    ...params,
                },
                this.useCallback(callback, [callback])
            );
        },
        useCallback(callback, deps) {
            return useCallback((raw) => {
                const event = channel.events[raw.name];

                if (event == null) {
                    console.error(`Unkown event: ${raw.name}`);
                    return;
                }

                return callback({
                    ...raw,
                    name: raw.name,
                    data: event.parse(raw) as never,
                });
                // eslint-disable-next-line react-hooks/exhaustive-deps
            }, deps);
        },
        ...Object.fromEntries(events),
    };

    return c;
}
