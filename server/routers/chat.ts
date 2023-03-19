import { TRPCError } from "@trpc/server";
import prisma from "@/prisma/client";
import { channels } from "@/utils/ably";
import { z } from "zod";
import ably from "../ably";
import { protectedProcedure, router } from "./../trpc";
import { Session } from "next-auth";

export const contentSchema = z.string().min(1).max(2000).trim();

export const chatRouter = router({
    send: protectedProcedure
        .input(
            z.object({
                groupId: z.number(),
                message: contentSchema,
            })
        )
        .mutation(async ({ input, ctx }) => {
            await checkIsMemberOf(input.groupId, ctx.session);

            const userId = ctx.session.user.id;
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

            await channels.chat.message_sent.publish(
                ably,
                [input.groupId],
                message
            );
            return message;
        }),
    messages: protectedProcedure
        .input(
            z.object({
                groupId: z.number(),
                count: z.number().min(0).max(50).default(50),
                cursorType: z.enum(["after", "before"]).default("before"),
                cursor: z.string().datetime().optional(),
            })
        )
        .query(async ({ input, ctx }) => {
            await checkIsMemberOf(input.groupId, ctx.session);
            const messages = await prisma.message.findMany({
                include: {
                    author: true,
                },
                orderBy: {
                    timestamp: "desc",
                },
                where: {
                    group_id: input.groupId,
                    timestamp:
                        input.cursor != null
                            ? {
                                  [input.cursorType === "after" ? "gt" : "lt"]:
                                      input.cursor,
                              }
                            : undefined,
                },
                take: Math.min(input.count, 50),
            });

            return messages;
        }),
    update: protectedProcedure
        .input(
            z.object({
                messageId: z.number(),
                groupId: z.number(),
                content: contentSchema,
            })
        )
        .mutation(async ({ ctx, input }) => {
            const result = await prisma.message.updateMany({
                where: {
                    id: input.messageId,
                    author_id: ctx.session.user.id,
                },
                data: {
                    content: input.content,
                },
            });

            if (result.count === 0)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "No permission or message doesn't exist",
                });

            await channels.chat.message_updated.publish(ably, [input.groupId], {
                id: input.messageId,
                content: input.content,
            });
        }),
    delete: protectedProcedure
        .input(
            z.object({
                messageId: z.number(),
                groupId: z.number(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const result = await prisma.message.deleteMany({
                where: {
                    id: input.messageId,
                    author_id: ctx.session.user.id,
                    group_id: input.groupId,
                },
            });

            if (result.count === 0)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "No permission or message doesn't exist",
                });

            await channels.chat.message_deleted.publish(ably, [input.groupId], {
                id: input.messageId,
            });
        }),
});

export async function checkIsMemberOf(group: number, user: Session) {
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
            message: "You must be the owner of the group to do this action",
            code: "BAD_REQUEST",
        });
    }

    return member;
}

export async function checkIsOwnerOf(group: number, user: Session) {
    const res = await prisma.group.findFirst({
        where: {
            id: group,
            owner_id: user.user.id,
        },
    });

    if (res == null) {
        throw new TRPCError({
            message: "You must join the group in order to receive messages",
            code: "BAD_REQUEST",
        });
    }
}
