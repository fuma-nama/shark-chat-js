import { channels, getChannel, publishMessage } from "@/utils/ably";
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
        .mutation(({ input }) => {
            const channel = getChannel(ably, channels.chat, undefined);

            let time = 0;
            const timer = setInterval(() => {
                publishMessage(channel, channels.chat.message_sent, {
                    message: input.message + time++,
                });

                if (time >= 10) clearInterval(timer);
            }, 1000);
        }),
});
