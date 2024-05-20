import { z } from "zod";
import { Group } from "db/schema";
import { GroupWithNotifications } from "../routers/group/group";
import { DMChannel } from "../routers/dm";
import { ComplexMessage } from "../utils/messages";
import { Serialize } from "shared/types";
import { UserInfo } from "shared/schema/chat";

export const schema = {
  /**
   * Private channel for per user
   */
  private: {
    name(clientId: string) {
      return `private:${clientId}`;
    },

    group_created: z.custom<GroupWithNotifications>().transform(serialize),
    group_removed: z
      .custom<Pick<GroupWithNotifications, "id">>()
      .transform(serialize),
    open_dm: z.custom<DMChannel>().transform(serialize),
    close_dm: z.custom<{ channel_id: string }>().transform(serialize),
  },

  group: {
    name(groupId: string) {
      return `group:${groupId}`;
    },

    group_updated: z
      .custom<{
        groupId: string;
        group: Partial<Group>;
      }>()
      .transform(serialize),

    group_deleted: z
      .custom<Pick<GroupWithNotifications, "id">>()
      .transform(serialize),
  },
  chat: {
    name(channelId: string) {
      return `chat:${channelId}`;
    },

    typing: z
      .object({ channelId: z.string(), user: z.custom<UserInfo>() })
      .transform(serialize),

    message_sent: z
      .custom<ComplexMessage & { nonce?: number }>()
      .transform(serialize),

    message_updated: z
      .custom<
        Pick<ComplexMessage, "id" | "channel_id" | "content" | "embeds">
      >()
      .transform(serialize),
    message_deleted: z
      .custom<Pick<ComplexMessage, "id" | "channel_id">>()
      .transform(serialize),
  },
};

/**
 * Because messages are serialized with JSON, we should change the output type
 */
function serialize<T>(v: T): Serialize<T> {
  return v as Serialize<T>;
}
