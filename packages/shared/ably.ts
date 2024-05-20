import type { Rest } from "ably";
import type { z, ZodTypeAny } from "zod";

type Channel<Args> = {
  name: (args: Args) => string;
};

export function createPublish<Schema extends Record<string, Channel<any>>>(
  ably: Rest,
  schema: Schema,
): {
  publish<Channel extends keyof Schema, Event extends keyof Schema[Channel]>(
    channel: Channel,
    name: Parameters<Schema[Channel]["name"]>,
    event: {
      type: Event;
      data: Schema[Channel][Event] extends ZodTypeAny
        ? z.input<Schema[Channel][Event]>
        : never;
    },
  ): Promise<void>;
} {
  return {
    async publish(c, n, e) {
      await ably.channels.get(schema[c].name(n)).publish({
        name: e.type as string,
        data: e.data,
      });
    },
  };
}
