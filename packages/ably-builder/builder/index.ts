import { Serialize } from "shared/types";
import { z, ZodType } from "zod";
import { ChannelAndClient } from "../hooks";
import { DependencyList } from "react";
import { AblyMessageCallback } from "ably/react";
import { Message, RealtimeChannel } from "ably";

type ConnectParams = {
  enabled?: boolean;
};

type EventMessage<T> = Omit<Message, "data"> & {
  data: Serialize<T>;
};

type ChannelMessage<
  Events extends EventsRecord<unknown, boolean>,
  E extends keyof Events = keyof Events,
> = E extends keyof Events
  ? Omit<EventMessage<InferEventData<Events[E]>>, "name"> & {
      name: E;
    }
  : never;

type InferEventData<E> = E extends Event<unknown, infer T, boolean> ? T : never;
export type EventsRecord<Args, Realtime extends boolean> = Record<
  string,
  Event<Args, any, Realtime>
>;
export type EventBuilderRecord = Record<string, EventBuilder<any>>;

export type Event<Args, T, Realtime extends boolean> = Realtime extends true
  ? {
      parse(raw: Message): T;
      publish(args: Args, data: T): Promise<void>;
      useChannel(
        args: Args,
        params: ConnectParams,
        callback: (msg: EventMessage<T>) => void,
      ): ChannelAndClient;
    }
  : {
      parse(raw: Message): T;
      publish(args: Args, data: T): Promise<void>;
    };

export type Channel<
  Args,
  Events extends EventsRecord<Args, Realtime>,
  Realtime extends boolean,
> = (Realtime extends true
  ? {
      useChannel(
        args: Args,
        params: ConnectParams,
        callback: (msg: ChannelMessage<Events>) => void,
      ): ChannelAndClient;

      useCallback(
        callback: (msg: ChannelMessage<Events>) => void,
      ): AblyMessageCallback;
      channelName(args: Args): string;
      get(args: Args): RealtimeChannel;
    }
  : {
      channelName(args: Args): string;
      get(args: Args): RealtimeChannel;
    }) &
  Events;

export type ChannelBuilder<Args, Events extends EventBuilderRecord> = {
  data: (args: Args) => string[];
  events: Events;
};

export type EventBuilder<T> = {
  parse(raw: Message): T;
};

export type Schema = Record<string, ChannelBuilder<any, EventBuilderRecord>>;

export type SchemaToCaller<S extends Schema, Realtime extends boolean> = {
  [K in keyof S]: S[K] extends ChannelBuilder<infer Args, infer Events>
    ? Channel<
        Args,
        {
          [J in keyof Events]: Events[J] extends EventBuilder<infer T>
            ? Event<Args, T, Realtime>
            : never;
        },
        Realtime
      >
    : never;
};

function channel<Args, Events extends EventBuilderRecord>(
  data: (args: Args) => string[],
  events: Events,
): ChannelBuilder<Args, Events> {
  return {
    data,
    events: events,
  };
}

function event<T extends ZodType>(schema: T): EventBuilder<z.infer<T>> {
  return {
    parse(raw) {
      return schema.parse(raw.data);
    },
  };
}

export const a = { channel, event };
