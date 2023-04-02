import { z, ZodType } from "zod";
import { Types } from "ably";
import { ChannelAndClient, useChannel } from "./hooks";
import { Serialize } from "../types";
import { DependencyList, useCallback } from "react";
import { AblyMessageCallback } from "@ably-labs/react-hooks";

type ConnectParams = {
    enabled?: boolean;
};

type EventMessage<T> = Omit<Types.Message, "data"> & {
    data: Serialize<T>;
};

type ChannelMessage<
    Events extends EventsRecord<never>,
    E extends keyof Events = keyof Events
> = E extends keyof Events
    ? Omit<EventMessage<InferEventData<Events[E]>>, "name"> & {
          name: E;
      }
    : never;

type Channel<Args, Events extends EventsRecord<Args>> = {
    channelName(args: Args): string;
    get(args: Args): Types.RealtimeChannelPromise;
    useChannel(
        args: Args,
        params: ConnectParams,
        callback: (msg: ChannelMessage<Events>) => void
    ): ChannelAndClient;
    useCallback(
        callback: (msg: ChannelMessage<Events>) => void,
        dependencies: DependencyList
    ): AblyMessageCallback;
    _def: {
        data: (args: Args) => string[];
        name: string | null;
        ably: Types.RealtimePromise | null;
    };
} & Events;

type InferEventData<E> = E extends Event<never, infer T> ? T : never;
type EventsRecord<Args> = Record<string, Event<Args, any>>;

type Event<Args, T> = {
    parse(raw: Types.Message): T;
    publish(args: Args, data: T): Promise<void>;
    useChannel(
        args: Args,
        params: ConnectParams,
        callback: (msg: EventMessage<T>) => void
    ): ChannelAndClient;
    _def: {
        name: string | null;
        channel: Channel<Args, EventsRecord<Args>> | null;
    };
};

function channel<Args, Events extends EventsRecord<Args>>(
    data: (args: Args) => string[],
    events: Events
): Channel<
    Args,
    {
        [K in keyof Events]: Events[K] extends Event<Args, infer T>
            ? Event<Args, T>
            : never;
    }
> {
    const channel: Channel<Args, EventsRecord<Args>> = {
        channelName(args) {
            return [this._def.name, ...this._def.data(args)].join(":");
        },
        get(args) {
            const ably = this._def.ably!!;

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
                const event = events[raw.name];

                if (event == null) {
                    console.error(`Unkown event: ${raw.name}`);
                    return;
                }

                return callback({
                    ...raw,
                    name: raw.name,
                    data: event.parse(raw),
                });
                // eslint-disable-next-line react-hooks/exhaustive-deps
            }, deps);
        },
        _def: {
            data,
            name: null,
            ably: null,
        },
        ...events,
    };

    for (const [key, event] of Object.entries(events)) {
        event._def.name = key;
        event._def.channel = channel;
    }

    return channel as any;
}

function event<T extends ZodType>(schema: T): Event<unknown, z.infer<T>> {
    return {
        parse(raw) {
            return schema.parse(raw.data);
        },
        publish(args, data) {
            const channel = this._def.channel!!.get(args);

            return channel.publish(this._def.name!!, data);
        },
        useChannel(args, params, callback) {
            const channel = this._def.channel!!.channelName(args);
            const event = this._def.name!!;

            return useChannel(
                {
                    channelName: channel,
                    events: [event],
                    ...params,
                },
                useCallback(
                    (raw) => {
                        return callback({
                            ...raw,
                            data: this.parse(raw),
                        });
                    },
                    [callback]
                )
            );
        },
        _def: {
            name: null,
            channel: null,
        },
    };
}

type ChannelsBuilder<C> = C & {
    config(ably: Types.RealtimePromise): void;
};

function channels<C extends Record<string, Channel<any, any>>>(
    root: C
): ChannelsBuilder<C> {
    return {
        ...root,
        config: (ably) => {
            for (const [key, channel] of Object.entries(root)) {
                channel._def.name = key;
                channel._def.ably = ably;
            }
        },
    };
}

export const a = { channels, channel, event };
