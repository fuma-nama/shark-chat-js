import {
    AblyMessageCallback,
    assertConfiguration,
    ChannelNameAndOptions,
} from "@ably-labs/react-hooks";
import { useEffect } from "react";
import type { Types } from "ably";

export type ChannelAndClient = [
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
    listener: AblyMessageCallback
): ChannelAndClient {
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
        channel.unsubscribe(listener);
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

export function useChannels(
    channelList: Types.RealtimeChannelPromise[],
    onEvent: AblyMessageCallback
) {
    useEffect(() => {
        for (const channel of channelList) {
            channel.subscribe(onEvent);
        }

        return () => {
            for (const channel of channelList) {
                channel.unsubscribe(onEvent);
            }
        };
    }, [channelList, onEvent]);
}
