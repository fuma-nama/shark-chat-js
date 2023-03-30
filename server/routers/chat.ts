import { TRPCError } from "@trpc/server";
import prisma from "@/server/prisma";
import { channels } from "@/utils/ably";
import { z } from "zod";
import ably from "../ably";
import { protectedProcedure, router } from "./../trpc";
import { contentSchema } from "../schema/chat";
import { checkIsMemberOf } from "@/utils/trpc/permissions";

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
                    author: {
                        select: {
                            id: true,
                            name: true,
                            image: true,
                        },
                    },
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
                    author: {
                        select: {
                            name: true,
                            id: true,
                            image: true,
                        },
                    },
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
    /**
     * Group owner can delete anyone's messages
     * Author can only delete their messages
     */
    delete: protectedProcedure
        .input(
            z.object({
                messageId: z.number(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const message = await prisma.message.findUnique({
                include: {
                    group: {
                        select: {
                            owner_id: true,
                        },
                    },
                },
                where: {
                    id: input.messageId,
                },
            });

            if (message == null)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Message not found",
                });

            const allowed =
                message.author_id === ctx.session.user.id ||
                message.group.owner_id === ctx.session.user.id;

            if (!allowed) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Missing required permission",
                });
            }

            await prisma.message.delete({
                where: {
                    id: input.messageId,
                },
            });

            await channels.chat.message_deleted.publish(
                ably,
                [message.group_id],
                {
                    id: message.id,
                }
            );
        }),
});
