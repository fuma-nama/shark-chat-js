import { TRPCError } from "@trpc/server";
import prisma from "@/server/prisma";
import { channels } from "@/server/ably";
import { z } from "zod";
import { protectedProcedure, router } from "./../trpc";
import { contentSchema, userSelect } from "../schema/chat";
import { checkIsMemberOf } from "@/utils/trpc/permissions";
import { onReceiveMessage } from "../inworld";
import { getLastRead, setLastRead } from "../utils/last-read";

export const chatRouter = router({
    send: protectedProcedure
        .input(
            z.object({
                groupId: z.number(),
                message: contentSchema,
                nonce: z.number().optional(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const message = await prisma.$transaction(async () => {
                await checkIsMemberOf(input.groupId, ctx.session);

                const message = await prisma.message.create({
                    data: {
                        author_id: ctx.session.user.id,
                        content: input.message,
                        group_id: input.groupId,
                    },
                    include: {
                        author: userSelect,
                    },
                });

                await setLastRead(
                    input.groupId,
                    ctx.session.user.id,
                    message.timestamp
                );

                return {
                    ...message,
                    nonce: input.nonce,
                };
            });

            await channels.chat.message_sent.publish([input.groupId], message);

            if (input.message.startsWith("@Shark")) {
                await onReceiveMessage({
                    group_id: message.group_id,
                    content: message.content.replaceAll("@Shark", ""),
                    user_name: message.author.name,
                });
            }

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

            return await prisma.message.findMany({
                include: {
                    author: userSelect,
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
                    group_id: input.groupId,
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

            await channels.chat.message_updated.publish([input.groupId], {
                id: input.messageId,
                content: input.content,
                group_id: input.groupId,
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

            await channels.chat.message_deleted.publish([message.group_id], {
                id: message.id,
                group_id: message.group_id,
            });
        }),
    read: protectedProcedure
        .input(z.object({ groupId: z.number() }))
        .mutation(async ({ ctx, input }) => {
            await setLastRead(
                input.groupId,
                ctx.session.user.id,
                new Date(Date.now())
            );
        }),
    checkout: protectedProcedure
        .input(
            z.object({
                groupId: z.number(),
            })
        )
        .query(async ({ ctx, input }) => {
            const old = await getLastRead(input.groupId, ctx.session.user.id);

            await setLastRead(
                input.groupId,
                ctx.session.user.id,
                new Date(Date.now())
            );

            return { last_read: old };
        }),
    type: protectedProcedure
        .input(
            z.object({
                groupId: z.number(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const user = await prisma.user.findUnique({
                select: userSelect.select,
                where: {
                    id: ctx.session.user.id,
                },
            });

            if (user == null)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "User not found",
                });

            await channels.chat.typing.publish([input.groupId], {
                user,
            });
        }),
});
