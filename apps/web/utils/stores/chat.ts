import { create } from "zustand";
import { addNonce, removeNonce } from "../handlers/realtime/shared";
import { SendData } from "@/components/chat/Sendbar";
import { MessageType } from "../types";

/**
 * Message that being sent locally but not received from the server yet
 */
export type MessagePlaceholder = {
  data: SendData;
  reply?: MessageType;
  error?: string;
  nonce: number;
};

type SendbarData = {
  reply_to?: MessageType;
};

export type ChatStore = {
  sending: {
    [id: string]: MessagePlaceholder[];
  };
  sendbar: {
    [id: string]: SendbarData;
  };
  editing: {
    [id: string]: { messageId?: number };
  };
  messages: {
    [id: string]: MessageType[];
  };
  pointer: Map<string, number>;
  setEditing(channelId: string, messageId?: number): void;
  updatePointer(channelId: string): void;
  updateSendbar(id: string, data: Partial<SendbarData>): void;
  addSending: (
    id: string,
    data: SendData,
    reply?: MessageType,
  ) => MessagePlaceholder;
  errorSending: (id: string, nonce: number, message: string) => void;
  removeSending: (id: string, nonce: number) => void;
};

export const useMessageStore = create<ChatStore>((set) => ({
  sendbar: {},
  sending: {},
  editing: {},
  messages: {},
  pointer: new Map(),
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
  updateSendbar(id, data) {
    set((prev) => ({
      ...prev,
      sendbar: {
        ...prev.sendbar,
        [id]: {
          ...prev.sendbar[id],
          ...data,
        },
      },
    }));
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
