import { InferChannelMessage, Channels, channels } from "@/utils/ably";
import { RouterInput, trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";
import { useCallback } from "react";

export function useMessageHandlers(variables: RouterInput["chat"]["messages"]) {
    const { status } = useSession();
    const utils = trpc.useContext();

    function onEvent(message: InferChannelMessage<Channels["chat"]>) {
        if (message.name === "message_sent") {
            return utils.chat.messages.setInfiniteData(variables, (prev) => {
                if (prev == null) return prev;

                return {
                    ...prev,
                    pages: [...prev.pages, [message.data]],
                };
            });
        }

        if (message.name === "message_updated") {
            return utils.chat.messages.setInfiniteData(variables, (prev) => {
                if (prev == null) return prev;

                const pages = prev.pages.map((page) =>
                    page.map((msg) => {
                        if (msg.id === message.data.id) {
                            return {
                                ...msg,
                                content: message.data.content,
                            };
                        }

                        return msg;
                    })
                );

                return {
                    ...prev,
                    pages,
                };
            });
        }

        if (message.name === "message_deleted") {
            return utils.chat.messages.setInfiniteData(variables, (prev) => {
                if (prev == null) return prev;

                const pages = prev.pages.map((page) => {
                    return page.filter((msg) => msg.id !== message.data.id);
                });
                return {
                    ...prev,
                    pages,
                };
            });
        }
    }

    return channels.chat.useChannel(
        [variables.groupId],
        { enabled: status === "authenticated" },
        useCallback(onEvent, [utils.chat.messages, variables])
    );
}

export function useDirectMessageHandlers(
    variables: RouterInput["dm"]["messages"]
) {
    const { status, data } = useSession();
    const utils = trpc.useContext();

    function onEvent(message: InferChannelMessage<Channels["dm"]>) {
        if (message.name === "message_sent") {
            return utils.dm.messages.setInfiniteData(variables, (prev) => {
                if (prev == null) return prev;

                return {
                    ...prev,
                    pages: [...prev.pages, [message.data]],
                };
            });
        }

        if (message.name === "message_updated") {
            return utils.dm.messages.setInfiniteData(variables, (prev) => {
                if (prev == null) return prev;

                const pages = prev.pages.map((page) =>
                    page.map((msg) => {
                        if (msg.id === message.data.id) {
                            return {
                                ...msg,
                                content: message.data.content,
                            };
                        }

                        return msg;
                    })
                );

                return {
                    ...prev,
                    pages,
                };
            });
        }

        if (message.name === "message_deleted") {
            return utils.dm.messages.setInfiniteData(variables, (prev) => {
                if (prev == null) return prev;

                const pages = prev.pages.map((page) => {
                    return page.filter((msg) => msg.id !== message.data.id);
                });
                return {
                    ...prev,
                    pages,
                };
            });
        }
    }

    channels.dm.useChannel(
        [variables.userId, data?.user?.id ?? ""],
        {
            enabled: status === "authenticated",
        },
        useCallback(onEvent, [utils.dm.messages, variables])
    );
}
