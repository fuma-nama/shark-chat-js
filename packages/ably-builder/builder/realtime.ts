import { useCallback, useRef } from "react";
import type { Realtime } from "ably";
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
  ably: Realtime,
  schema: S,
): SchemaToCaller<S, true> {
  const caller = Object.entries(schema).map(([k, channel]) => {
    return [k, buildRealtimeChannel(ably, channel, k)];
  });

  return Object.fromEntries(caller);
}

function buildRealtimeChannel(
  ably: Realtime,
  channel: ChannelBuilder<unknown, EventBuilderRecord>,
  channel_name: string,
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
          (raw) => {
            return callback({
              ...raw,
              data: this.parse(raw) as never,
            });
          },
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
        this.useCallback(callback),
      );
    },
    useCallback(callback) {
      const ref = useRef(callback);
      ref.current = callback;

      return useCallback((raw) => {
        if (!raw.name) return;
        const event = channel.events[raw.name];

        if (event == null) {
          console.error(`Unknown event: ${raw.name}`);
          return;
        }

        return ref.current({
          ...raw,
          name: raw.name,
          data: event.parse(raw),
        });
      }, []);
    },
    ...Object.fromEntries(events),
  };

  return c;
}
