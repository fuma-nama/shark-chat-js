import { create } from "zustand";
import { addNonce, removeNonce } from "../handlers/shared";
import { SendData } from "@/components/chat/Sendbar";
import { MessageType } from "../types";
import type { UserProfile } from "server/routers/chat";

/**
 * Message that being sent locally but not received from the server yet
 */
export type MessagePlaceholder = {
  data: SendData;
  reply?: MessageType;
  error?: string;
  nonce: number;
};

export interface TypingUser {
  timestamp: number;
  user: UserProfile;
}

export type ChatStore = {
  sending: {
    [id: string]: MessagePlaceholder[];
  };
  editing: {
    [id: string]: { messageId?: number };
  };
  messages: {
    [id: string]: MessageType[];
  };
  typing: Map<string, TypingUser[]>;
  reply: Map<string, MessageType>;
  pointer: Map<string, number>;
  setEditing(channelId: string, messageId?: number): void;
  updatePointer(channelId: string): void;
  updateReply(channelId: string, data: MessageType | null): void;
  setUserTyping(channelId: string, user: UserProfile): void;
  addSending: (
    id: string,
    data: SendData,
    reply?: MessageType,
  ) => MessagePlaceholder;
  errorSending: (id: string, nonce: number, message: string) => void;
  removeSending: (id: string, nonce: number) => void;
};

export const useMessageStore = create<ChatStore>((set) => ({
  sending: {},
  editing: {},
  messages: {},
  pointer: new Map(),
  reply: new Map(),
  typing: new Map(),
  updatePointer(channelId) {
    set((prev) => {
      const next = new Map(prev.pointer);
      const messages = prev.messages[channelId];
      if (messages && messages.length > 0)
        next.set(channelId, new Date(messages[0].timestamp).getTime());

      return {
        pointer: next,
      };
    });
  },
  setUserTyping(channelId: string, user: UserProfile) {
    set((prev) => {
      const next = new Map(prev.typing);
      let channel = next.get(channelId) ?? [];
      channel = channel.filter((item) => item.user.id !== user.id);
      channel.push({ user, timestamp: Date.now() });
      next.set(channelId, channel);

      return {
        typing: next,
      };
    });
  },
  setEditing(channelId: string, messageId?: number) {
    set((prev) => ({
      editing: {
        ...prev.editing,
        [channelId]: { messageId },
      },
    }));
  },
  addSending: (group, data, reply) => {
    const item: MessagePlaceholder = {
      data,
      reply,
      nonce: Date.now(),
    };

    addNonce(item.nonce);
    set((prev) => {
      return {
        sending: {
          ...prev.sending,
          [group]: [...(prev.sending[group] ?? []), item],
        },
      };
    });

    return item;
  },
  updateReply(channelId: string, data: MessageType | null) {
    set((prev) => {
      const next = new Map(prev.reply);
      if (!data) next.delete(channelId);
      else next.set(channelId, data);

      return {
        reply: next,
      };
    });
  },
  errorSending(group, nonce, message) {
    set((prev) => {
      const updated = prev.sending[group]?.map((item) =>
        item.nonce === nonce ? { ...item, error: message } : item,
      );

      return {
        sending: {
          ...prev.sending,
          [group]: updated,
        },
      };
    });
  },
  removeSending(group, nonce) {
    removeNonce(nonce);
    set((prev) => {
      const filtered = prev.sending[group]?.filter(
        (item) => item.nonce !== nonce,
      );

      return {
        sending: {
          ...prev.sending,
          [group]: filtered,
        },
      };
    });
  },
}));
