import { create } from "zustand";
import { addNonce, removeNonce } from "../handlers/realtime/shared";

/**
 * Message that being sent locally but not received from the server yet
 */
export type MessagePlaceholder = {
    content: string;
    nonce: number;
    error?: string;
};

export type ChatStore<K extends number | string> = {
    sending: {
        [key in K]: MessagePlaceholder[];
    };
    addSending: (key: K, content: string) => MessagePlaceholder;
    errorSending: (key: K, nonce: number, message: string) => void;
    removeSending: (key: K, nonce: number) => void;
};

function createMessageStore<K extends number | string>() {
    return create<ChatStore<K>>((set) => ({
        sending: {} as any,
        addSending: (group, content) => {
            const item: MessagePlaceholder = {
                content,
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

export const useGroupMessage = createMessageStore<number>();
export const useDirectMessage = createMessageStore<string>();
