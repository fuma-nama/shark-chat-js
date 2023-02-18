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
                groupId: z.number(),
                message: z.string(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const userId = ctx.session!!.user.id;
            const channel = channels.chat.get(ably);

            const message = await prisma.message.create({
                data: {
                    author_id: userId,
                    content: input.message,
                    group_id: input.groupId,
                },
            });

            return message;
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

            return await prisma.message.findMany({
                select: {
                    author: true,
                    content: true,
                    group: true,
                    id: true,
                    timestamp: true,
                },
                where: {
                    group_id: input.groupId,
                },
                take: Math.min(input.count, 50),
            });
        }),
});
