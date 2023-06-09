import { create } from "zustand";
import { addNonce, removeNonce } from "../handlers/realtime/shared";
import { SendData } from "@/components/chat/Sendbar";
import { MessageType } from "../types";

/**
 * Message that being sent locally but not received from the server yet
 */
export type MessagePlaceholder = {
    data: SendData;
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
    updateSendbar(id: string, data: Partial<SendbarData>): void;
    addSending: (id: string, data: SendData) => MessagePlaceholder;
    errorSending: (id: string, nonce: number, message: string) => void;
    removeSending: (id: string, nonce: number) => void;
};

export const useMessageStore = create<ChatStore>((set) => ({
    sendbar: {} as any,
    sending: {} as any,
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
    addSending: (group, data) => {
        const item: MessagePlaceholder = {
            data,
            nonce: Date.now(),
        };

        addNonce(item.nonce);
        set((prev) => {
            const next = {
                ...prev.sending,
                [group]: [...(prev.sending[group] ?? []), item],
            };

            return {
                sending: next,
            };
        });

        return item;
    },
    errorSending(group, nonce, message) {
        set((prev) => {
            const updated = prev.sending[group]?.map((item) =>
                item.nonce === nonce ? { ...item, error: message } : item
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
                (item) => item.nonce !== nonce
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
