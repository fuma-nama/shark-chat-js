import { z, ZodType } from "zod";
import { Types } from "ably";
import { ChannelAndClient, useChannel } from "./hooks";

type ConnectParams = {
    enabled?: boolean;
};

export type AnyChannel<Args> = Channel<Args, Record<string, any>>;
export type Channel<Args, Events extends EventsRecord<Args>> = {
    channelName(args: Args): string;
    get(ably: Types.RealtimePromise, args: Args): Types.RealtimeChannelPromise;
    useChannel(
        args: Args,
        params: ConnectParams,
        callback: (msg: AnyMessage<Events>) => void
    ): ChannelAndClient;
    _def: {
        data: (args: Args) => string[];
        name: string | null;
        init(name: string): void;
    };
} & Events;

type AnyMessage<
    Events extends EventsRecord<never>,
    E extends keyof Events = keyof Events
> = Events extends Events
    ? {
          event: E;
          data: InferEventData<Events[E]>;
      }
    : never;

type InferEventData<E> = E extends Event<never, infer T> ? T : never;
type EventsRecord<Args> = Record<string, Event<Args, any>>;

export type Event<Args, T> = {
    parse(raw: Types.Message): T;
    publish(channel: Types.RealtimeChannelPromise, data: T): Promise<void>;
    useChannel(
        args: Args,
        params: ConnectParams,
        callback: (msg: EventMessage<T>) => void
    ): ChannelAndClient;
    _def: {
        name: string | null;
        channel: Channel<Args, EventsRecord<Args>> | null;
        init(name: string, channel: Channel<Args, any>): void;
    };
};

type EventMessage<T> = {
    data: T;
};

function channel<Args = void, Events extends EventsRecord<Args> = {}>(
    data: (args: Args) => string[],
    events: Events
): Channel<Args, Events extends Events ? Events : never> {
    const channel: Channel<Args, Events> = {
        channelName(args) {
            return [this._def.name, ...this._def.data(args)].join(":");
        },
        get(ably, args) {
            return ably.channels.get(this.channelName(args));
        },
        useChannel(args, params, callback) {
            return useChannel(
                {
                    channelName: this.channelName(args),
                    ...params,
                },
                (raw) => {
                    const event = events[raw.name];

                    if (event == null) {
                        console.error(`Unkown event: ${raw.name}`);
                        return;
                    }

                    const message = {
                        event: raw.name,
                        data: event.parse(raw),
                    } as unknown as AnyMessage<Events, keyof Events>;

                    return callback(message);
                }
            );
        },
        _def: {
            data,
            name: null,
            init(name) {
                this.name = name;
            },
        },
        ...events,
    };

    for (const [key, event] of Object.entries(events)) {
        event._def.init(key, channel);
    }

    return channel;
}

function event<Args, T extends ZodType>(schema: T): Event<Args, z.infer<T>> {
    return {
        parse(raw) {
            return schema.parse(raw.data);
        },
        publish(channel, data) {
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
                (raw) => {
                    const message: EventMessage<T> = {
                        data: this.parse(raw),
                    };

                    return callback(message);
                }
            );
        },
        _def: {
            name: null,
            channel: null,
            init(name, channel) {
                this.name = name;
                this.channel = channel;
            },
        },
    };
}

export type Channels<C> = {
    [K in keyof C]: C[K] extends Channel<any, any> ? C[K] : never;
};

function channels<
    C extends {
        [K in keyof C]: C[K] extends Channel<never, infer _Events>
            ? C[K]
            : never;
    }
>(root: C): Channels<C> {
    for (const [key, channel] of Object.entries(root as any)) {
        (channel as Channel<unknown, EventsRecord<unknown>>)._def.init(key);
    }

    return root;
}

export const a = { channels, channel, event };
