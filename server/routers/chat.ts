import { publishMessage, TypedChannelPromise } from "@/utils/ably";
import { z } from "zod";
import ably from "../ably";
import { protectedProcedure, router } from "./../trpc";

export const chatRouter = router({
    send: protectedProcedure
        .input(
            z.object({
                message: z.string(),
            })
        )
        .mutation(({ input, ctx }) => {
            const clientId = ctx.session?.user.id;
            if (clientId == null) return;

            const channel: TypedChannelPromise<"private"> = ably.channels.get(
                `private:${clientId}`
            );
            let time = 0;

            const timer = setInterval(() => {
                publishMessage(channel, "message_sent", {
                    message: input.message + time++,
                });

                if (time >= 10) clearInterval(timer);
            }, 1000);
        }),
});
