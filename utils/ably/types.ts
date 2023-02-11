import { Types } from "ably";
import { z, ZodType } from "zod";
import { Channels } from "./channels";

export type TypedChannelPromise<C extends keyof Channels> = {
    [K in keyof Types.RealtimeChannelPromise]: Types.RealtimeChannelPromise[K];
};

export type TypedChannels = {
    [key: string]: {
        [event: string]: ZodType | any;
    };
};

export type InferChannelTypes<Channels extends TypedChannels> = {
    [K in keyof Channels]: {
        [E in keyof Channels[K]]: Channels[K][E] extends ZodType
            ? z.infer<Channels[K][E]>
            : Channels[K][E];
    };
};

export type MessageData<
    C extends keyof Channels,
    E extends keyof Channels[C]
> = Channels[C][E];

export type ParsedMessage<
    C extends keyof Channels,
    E extends keyof Channels[C] = keyof Channels[C]
> = E extends E
    ? {
          event: E;
          data: Channels[C][E];
      }
    : never;
