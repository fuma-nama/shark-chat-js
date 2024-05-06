import { AblyMessageCallback, useAbly } from "ably/react";
import { useEffect, useRef } from "react";
import type {
  ChannelOptions,
  MessageFilter,
  Realtime,
  RealtimeChannel,
} from "ably";

export type ChannelAndClient = [channel: RealtimeChannel, message: Realtime];

export type UseChannelParam = ChannelOptions & {
  channelName: string;
  /**
   * Accepted events or message filter
   */
  events?: string | string[] | MessageFilter;
  enabled?: boolean;
};

/**
 * Customized use channel hook
 */
export function useChannel(
  { channelName, events, enabled = true, ...options }: UseChannelParam,
  listener: AblyMessageCallback,
): ChannelAndClient {
  const ably = useAbly();
  const channel = ably.channels.get(channelName, options);
  const listenerRef = useRef(listener);
  listenerRef.current = listener;

  useEffect(() => {
    if (!enabled) return;

    const onEvent = listenerRef.current;
    if (events != null) {
      void channel.subscribe(events as any, onEvent);
    } else {
      void channel.subscribe(onEvent);
    }

    return () => {
      channel.unsubscribe(onEvent);
    };
  }, [channel, enabled, events]);

  return [channel, ably];
}

export function useChannels(
  channelList: RealtimeChannel[],
  onEvent: AblyMessageCallback,
) {
  useEffect(() => {
    for (const channel of channelList) {
      void channel.subscribe(onEvent);
    }

    return () => {
      for (const channel of channelList) {
        channel.unsubscribe(onEvent);
      }
    };
  }, [channelList, onEvent]);
}
