import { create } from "zustand";
import { addNonce, removeNonce } from "../handlers/realtime/shared";
import { SendData } from "@/components/chat/Sendbar";
import { DirectMessageType, MessageType } from "@/server/schema/chat";

/**
 * Message that being sent locally but not received from the server yet
 */
export type MessagePlaceholder = {
    data: SendData;
    error?: string;
    nonce: number;
};

type DMSendbarData = {
    reply_to?: DirectMessageType;
};

type GroupSendbarData = {
    reply_to?: MessageType;
};

export type ChatStore<K extends number | string, Data> = {
    sending: {
        [key in K]: MessagePlaceholder[];
    };
    sendbar: {
        [key in K]: Data;
    };
    updateSendbar(key: K, data: Partial<Data>): void;
    addSending: (key: K, data: SendData) => MessagePlaceholder;
    errorSending: (key: K, nonce: number, message: string) => void;
    removeSending: (key: K, nonce: number) => void;
};

function createMessageStore<K extends number | string, Data>() {
    return create<ChatStore<K, Data>>((set) => ({
        sendbar: {} as any,
        sending: {} as any,
        updateSendbar(key, data) {
            set((prev) => ({
                ...prev,
                sendbar: {
                    ...prev.sendbar,
                    [key]: {
                        ...prev.sendbar[key],
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
}

export const useGroupMessage = createMessageStore<number, GroupSendbarData>();
export const useDirectMessage = createMessageStore<string, DMSendbarData>();
