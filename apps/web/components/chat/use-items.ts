import { MessageType } from "@/utils/types";
import { MessagePlaceholder, useMessageStore } from "@/utils/stores/chat";
import { useSession } from "next-auth/react";
import { useMemo } from "react";

export type ListItem =
  | {
      id: number;
      type: "message";
      message: MessageType;
      chainStart: boolean;
      chainEnd: boolean;
    }
  | {
      id: string;
      type: "unread";
    }
  | {
      type: "pending";
      id: string;
      message: MessagePlaceholder;
      chainStart: boolean;
      chainEnd: boolean;
    };

const minSeparateTime = 12 * 1000;

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

    function getLastMessage() {
      const last = items[items.length - 1];
      return last?.type === "message" ? last : undefined;
    }

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

      const prev = getLastMessage();
      const isChain =
        message.author != null &&
        prev != null &&
        message.reply_id == null &&
        prev.message.author?.id === message.author.id &&
        time.getTime() - previousTimestamp!.getTime() <= minSeparateTime;

      if (isChain) {
        prev!.chainEnd = false;
      }

      items.push({
        id: message.id,
        type: "message",
        message,
        chainStart: !isChain,
        chainEnd: true,
      });
      previousTimestamp = time;
    }

    for (const message of sending) {
      const prev = items.length > 0 ? items[items.length - 1] : undefined;
      const authorId = data.user.id;
      const time = Date.now();
      const isChain =
        // automatically chain with pending messages
        prev?.type === "pending" ||
        (prev?.type === "message" &&
          message.reply == null &&
          prev.message.author?.id === authorId &&
          time - previousTimestamp!.getTime() <= minSeparateTime);

      if (isChain) {
        prev!.chainEnd = false;
      }

      items.push({
        id: `pending:${message.nonce}`,
        type: "pending",
        message,
        chainStart: !isChain,
        chainEnd: true,
      });
      previousTimestamp = new Date(time);
    }

    return items;
  }, [data, messages, lastRead, sending]);
}
