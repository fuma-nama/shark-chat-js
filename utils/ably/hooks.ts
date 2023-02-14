import {
    AblyMessageCallback,
    assertConfiguration,
    ChannelNameAndOptions,
} from "@ably-labs/react-hooks";
import { Types } from "ably";
import { useCallback, useEffect } from "react";
import { Channels } from "./channels";
import { ParsedMessage } from "./types";
import { parseMessage } from "./utils";

export type UseTypedChannelParam<C extends keyof Channels> = Omit<
    UseChannelParam,
    "channelName" | "events"
> & {
    channel: [name: C, ...data: string[]];
};

export function useTypedChannel<C extends keyof Channels>(
    { channel, ...options }: UseTypedChannelParam<C>,
    callback: (message: ParsedMessage<C>) => void
): ChannelAndClient {
    return useChannel(
        {
            ...options,
            channelName: channel.join(":"),
        },
        (raw) => {
            const message = parseMessage<C>(raw, channel[0]);

            return callback(message);
        }
    );
}

export function useTypedChannelEvent<
    C extends keyof Channels,
    E extends keyof Channels[C]
>(
    {
        channel,
        event,
        ...options
    }: UseTypedChannelParam<C> & {
        event: E;
    },
    callback: (message: ParsedMessage<C, E>) => void
): ChannelAndClient {
    return useChannel(
        {
            ...options,
            channelName: channel.join(":"),
            events: event as string,
        },
        (raw) => {
            const message = parseMessage<C>(raw, channel[0]);

            return callback(message as unknown as ParsedMessage<C, E>);
        }
    );
}

type ChannelAndClient = [
    channel: Types.RealtimeChannelPromise,
    message: Types.RealtimePromise
];

export type UseChannelParam = ChannelNameAndOptions & {
    /**
     * Accepted events or message filter
     */
    events?: string | string[] | Types.MessageFilter;
    enabled?: boolean;
};

/**
 * Customized use channel hook
 */
export function useChannel(
    options: UseChannelParam,
    callbackOnMessage: AblyMessageCallback
): ChannelAndClient {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const listener = useCallback(callbackOnMessage, []);
    const ably = assertConfiguration();
    const channel = ably.channels.get(options.channelName, options.options);
    const enabled = options.enabled ?? true;

    const onMount = async () => {
        if (options.events != null) {
            await channel.subscribe(options.events as any, listener);
        } else {
            await channel.subscribe(listener);
        }
    };

    const onUnmount = async () => {
        if (options.events != null) {
            channel.unsubscribe(options.events as any, listener);
        } else {
            channel.unsubscribe(listener);
        }

        setTimeout(async () => {
            if (channel.listeners.length === 0) {
                await channel.detach();
            }
        }, 2500);
    };

    useEffect(() => {
        if (enabled) {
            onMount();

            return () => {
                onUnmount();
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [options.channelName, enabled]);

    return [channel, ably];
}
