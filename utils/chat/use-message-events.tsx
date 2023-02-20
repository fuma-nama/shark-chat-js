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

    channels.chat.message_sent.useChannel(
        undefined,
        { enabled: status === "authenticated" },
        (message) => {
            utils.chat.messages.setInfiniteData(variables, (prev) => {
                if (prev == null) return prev;

                return {
                    ...prev,
                    pages: [...prev.pages, [message.data]],
                };
            });
        }
    );
}
