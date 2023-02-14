import { getChannel, publishMessage } from "@/utils/ably";
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
            const clientId = ctx.session!!.user.id;
            const channel = getChannel(ably, "private", clientId);

            let time = 0;
            const timer = setInterval(() => {
                publishMessage(channel, "message_sent", {
                    message: input.message + time++,
                });

                if (time >= 10) clearInterval(timer);
            }, 1000);
        }),
});
