import { trpc } from "@/utils/trpc";
import { inferProcedureInput } from "@trpc/server";
import { useSession } from "next-auth/react";
import { channels } from "../ably";
import { Procedures } from "../trpc/types";

export function useMessageEvents(
    variables: inferProcedureInput<Procedures["chat"]["messages"]>
) {
    const { status } = useSession();
    const utils = trpc.useContext();

    channels.chat.useChannel(
        [variables.groupId],
        { enabled: status === "authenticated" },
        (message) => {
            if (message.event === "message_sent") {
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

            if (message.event === "message_updated") {
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

            if (message.event === "message_deleted") {
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
