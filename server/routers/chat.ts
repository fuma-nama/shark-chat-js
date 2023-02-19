import { TRPCError } from "@trpc/server";
import prisma from "@/prisma/client";
import { channels } from "@/utils/ably";
import { z } from "zod";
import ably from "../ably";
import { protectedProcedure, router } from "./../trpc";
import { Session } from "next-auth";

export const chatRouter = router({
    send: protectedProcedure
        .input(
            z.object({
                groupId: z.number(),
                message: z.string(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            await checkIsMemberOf(input.groupId, ctx.session);

            const userId = ctx.session.user.id;
            const channel = channels.chat.get(ably);
            const message = await prisma.message.create({
                data: {
                    author_id: userId,
                    content: input.message,
                    group_id: input.groupId,
                },
                include: {
                    author: true,
                },
            });

            await channels.chat.message_sent.publish(channel, message);
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
            await checkIsMemberOf(input.groupId, ctx.session);

            return await prisma.message.findMany({
                include: {
                    author: true,
                },
                orderBy: {
                    timestamp: "desc",
                },
                where: {
                    group_id: input.groupId,
                },
                take: Math.min(input.count, 50),
            });
        }),
});

async function checkIsMemberOf(group: number, user: Session) {
    const member = await prisma.member.findUnique({
        where: {
            group_id_user_id: {
                group_id: group,
                user_id: user.user.id,
            },
        },
    });

    if (member == null) {
        throw new TRPCError({
            message: "You must join the group in order to receive messages",
            code: "BAD_REQUEST",
        });
    }

    return member;
}
