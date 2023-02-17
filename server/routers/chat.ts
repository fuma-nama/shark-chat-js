import { channels } from "@/utils/ably";
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
            const channel = channels.chat.get(ably);

            let time = 0;
            const timer = setInterval(() => {
                channels.chat.message_sent.publish(channel, {
                    message: input.message + time++,
                });

                if (time >= 10) clearInterval(timer);
            }, 1000);
        }),
});
