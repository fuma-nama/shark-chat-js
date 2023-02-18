import { TRPCError } from "@trpc/server";
import prisma from "@/prisma/client";
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
    messages: protectedProcedure
        .input(
            z.object({
                groupId: z.number(),
                count: z.number().max(50).default(50),
                after: z.number().optional(),
                before: z.number().optional(),
            })
        )
        .query(async ({ input, ctx }) => {
            const userId = ctx.session!!.user.id;
            const member = prisma.member.findUnique({
                where: {
                    group_id_user_id: {
                        group_id: input.groupId,
                        user_id: userId,
                    },
                },
            });

            if (member == null) {
                throw new TRPCError({
                    message:
                        "You must join the group in order to receive messages",
                    code: "BAD_REQUEST",
                });
            }

            return prisma.message.findMany({
                where: {
                    group_id: input.groupId,
                },
                take: Math.min(input.count, 50),
            });
        }),
});
