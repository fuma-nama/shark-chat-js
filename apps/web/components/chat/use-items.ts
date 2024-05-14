import { MessageType } from "@/utils/types";
import { MessagePlaceholder, useMessageStore } from "@/utils/stores/chat";
import { useSession } from "next-auth/react";
import { useMemo } from "react";

export type ListItem =
  | {
      id: number;
      type: "message";
      message: MessageType;
      chain: boolean;
    }
  | {
      id: string;
      type: "unread";
    }
  | {
      type: "pending";
      id: string;
      message: MessagePlaceholder;
      chain: boolean;
    };

export function useItems(channelId: string, lastRead: Date | null): ListItem[] {
  const { data } = useSession();
  const [sending, messages] = useMessageStore((s) => [
    s.sending[channelId] ?? [],
    s.messages[channelId] ?? [],
  ]);

  return useMemo(() => {
    const items: ListItem[] = [];
    let previousTimestamp: Date | null = null;
    if (!data) return [];

    for (const message of messages) {
      const time = new Date(message.timestamp);

      if (
        lastRead &&
        lastRead < time &&
        (!previousTimestamp || previousTimestamp <= lastRead)
      )
        items.push({
          id: `unread:${lastRead.getTime()}`,
          type: "unread",
        });

      const prev = items.length > 0 ? items[items.length - 1] : undefined;

      items.push({
        id: message.id,
        type: "message",
        message,
        chain:
          message.author != null &&
          prev?.type === "message" &&
          prev.message.author?.id === message.author.id &&
          time.getTime() - previousTimestamp!.getTime() <= 10 * 1000 &&
          message.reply_id == null,
      });
      previousTimestamp = time;
    }

    for (const message of sending) {
      const prev = items.length > 0 ? items[items.length - 1] : undefined;
      const time = Date.now();

      items.push({
        id: `pending:${message.nonce}`,
        type: "pending",
        message,
        chain:
          prev?.type === "message" &&
          prev.message.author?.id === data.user.id &&
          time - previousTimestamp!.getTime() <= 10 * 1000 &&
          message.reply == null,
      });
      previousTimestamp = new Date(time);
    }

    return items;
  }, [data, messages, lastRead, sending]);
}
