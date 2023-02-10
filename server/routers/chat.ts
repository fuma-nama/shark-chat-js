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

            const channel = ably.channels.get("test");
            let time = 0;

            const timer = setInterval(() => {
                channel.publish("message_sent", input.message + time);
                time++;

                if (time >= 10) clearInterval(timer);
            }, 1000);
        }),
});
