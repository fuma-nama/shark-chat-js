import { trpc, type RouterInput } from "@/utils/trpc";
import { assertConfiguration } from "@ably-labs/react-hooks";
import { useSession } from "next-auth/react";
import { channels } from "../ably";
import { useBaseHandlers } from "./base";

export function useAblyHandlers() {
    const ably = assertConfiguration();
    const { data, status } = useSession();
    const handlers = useBaseHandlers();

    channels.private.useChannel(
        [data?.user?.id ?? ""],
        {
            enabled: status === "authenticated",
        },
        (message) => {
            const self = ably.connection.id === message.connectionId;

            switch (message.name) {
                case "group_created": {
                    if (self) return;

                    handlers.createGroup(message.data);
                }
                case "group_updated": {
                    if (self) return;

                    handlers.updateGroup(message.data);
                }
            }
        }
    );
}

export function useMessageHandlers(variables: RouterInput["chat"]["messages"]) {
    const { status } = useSession();
    const utils = trpc.useContext();

    channels.chat.useChannel(
        [variables.groupId],
        { enabled: status === "authenticated" },
        (message) => {
            if (message.name === "message_sent") {
                return utils.chat.messages.setInfiniteData(
                    variables,
                    (prev) => {
                        if (prev == null) return prev;

                        return {
                            ...prev,
                            pages: [...prev.pages, [message.data]],
                        };
                    }
                );
            }

            if (message.name === "message_updated") {
                return utils.chat.messages.setInfiniteData(
                    variables,
                    (prev) => {
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
                    }
                );
            }

            if (message.name === "message_deleted") {
                return utils.chat.messages.setInfiniteData(
                    variables,
                    (prev) => {
                        if (prev == null) return prev;

                        const pages = prev.pages.map((page) => {
                            return page.filter(
                                (msg) => msg.id !== message.data.id
                            );
                        });
                        return {
                            ...prev,
                            pages,
                        };
                    }
                );
            }
        }
    );
}
