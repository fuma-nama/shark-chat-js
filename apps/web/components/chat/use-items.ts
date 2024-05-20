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

const minSeparateTime = 30 * 1000;

export function useItems(
  channelId: string,
  lastRead: number | null,
): ListItem[] {
  const { data: session } = useSession();
  const [sending, messages] = useMessageStore((s) => [
    s.sending[channelId],
    s.messages[channelId],
  ]);

  return useMemo(() => {
    const items: ListItem[] = [];
    let previousTimestamp: Date | null = null;
    if (!session) return [];

    function getLastMessage() {
      const last = items[items.length - 1];
      return last?.type === "message" ? last : undefined;
    }

    for (const message of messages ?? []) {
      const time = new Date(message.timestamp);

      if (
        lastRead &&
        lastRead < time.getTime() &&
        (!previousTimestamp || previousTimestamp.getTime() <= lastRead)
      )
        items.push({
          id: `unread:${lastRead}`,
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

    for (const message of sending ?? []) {
      const prev = items.length > 0 ? items[items.length - 1] : undefined;
      const authorId = session.user.id;
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
  }, [session, messages, lastRead, sending]);
}
