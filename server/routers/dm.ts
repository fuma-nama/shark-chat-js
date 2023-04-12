import { protectedProcedure } from "./../trpc";
import { router } from "../trpc";
import { z } from "zod";
import prisma from "../prisma";
import { TRPCError } from "@trpc/server";
import { channels } from "@/server/ably";
import { RecentChatType, contentSchema, userSelect } from "../schema/chat";
import { getDMLastRead, setDMLastRead } from "../utils/last-read";
import { getLastMessage, setLastMessage } from "../utils/dm-last-message";

export const dmRouter = router({
    checkout: protectedProcedure
        .input(z.object({ userId: z.string() }))
        .query(async ({ ctx, input }) => {
            const old = await getDMLastRead(ctx.session.user.id, input.userId);

            await setDMLastRead(
                ctx.session.user.id,
                input.userId,
                new Date(Date.now())
            );

            return { last_read: old };
        }),
    read: protectedProcedure
        .input(z.object({ userId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            await setDMLastRead(
                ctx.session.user.id,
                input.userId,
                new Date(Date.now())
            );
        }),
    info: protectedProcedure
        .input(
            z.object({
                userId: z.string(),
            })
        )
        .query(async ({ input }) => {
            const target_user = await prisma.user.findUnique({
                where: {
                    id: input.userId,
                },
                select: userSelect.select,
            });

            if (target_user == null)
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "User not found",
                });
            return target_user;
        }),
    channels: protectedProcedure.query(({ ctx }) => {
        return prisma.$transaction(async () => {
            const channels = await prisma.directMessageChannel.findMany({
                include: {
                    receiver: userSelect,
                },
                where: {
                    author_id: ctx.session.user.id,
                },
            });

            const result = channels.map(async (channel) => {
                const unread_messages = await prisma.directMessage.count({
                    where: {
                        OR: [
                            {
                                author_id: channel.author_id,
                                receiver_id: channel.receiver_id,
                            },
                            {
                                author_id: channel.receiver_id,
                                receiver_id: channel.author_id,
                            },
                        ],
                        timestamp: {
                            gt:
                                (await getDMLastRead(
                                    ctx.session.user.id,
                                    channel.receiver_id
                                )) ?? undefined,
                        },
                    },
                });

                return {
                    ...channel,
                    unread_messages,
                    last_message: await getLastMessage(
                        ctx.session.user.id,
                        channel.receiver_id
                    ),
                };
            });

            return Promise.all<Promise<RecentChatType>>(result);
        });
    }),
    send: protectedProcedure
        .input(
            z.object({
                userId: z.string(),
                message: contentSchema,
                nonce: z.number().optional(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const userId = ctx.session.user.id;

            const message = await prisma.$transaction(async () => {
                await initChannel(input.userId, userId);
                const message = await prisma.directMessage.create({
                    data: {
                        author_id: userId,
                        content: input.message,
                        receiver_id: input.userId,
                    },
                    include: {
                        author: userSelect,
                        receiver: userSelect,
                    },
                });

                return { ...message, nonce: input.nonce };
            });

            await setLastMessage(userId, input.userId, input.message);
            await setDMLastRead(userId, input.userId, message.timestamp);

            if (input.userId !== userId) {
                await channels.private.message_sent.publish(
                    [input.userId],
                    message
                );
            }

            await channels.private.message_sent.publish([userId], message);
        }),
    messages: protectedProcedure
        .input(
            z.object({
                userId: z.string(),
                count: z.number().min(0).max(50).default(50),
                cursorType: z.enum(["after", "before"]).default("before"),
                cursor: z.string().datetime().optional(),
            })
        )
        .query(async ({ input, ctx }) => {
            return await prisma.directMessage.findMany({
                include: {
                    author: userSelect,
                },
                orderBy: {
                    timestamp: "desc",
                },
                where: {
                    OR: [
                        {
                            receiver_id: input.userId,
                            author_id: ctx.session.user.id,
                        },
                        {
                            receiver_id: ctx.session.user.id,
                            author_id: input.userId,
                        },
                    ],
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
                userId: z.string(),
                content: contentSchema,
            })
        )
        .mutation(async ({ ctx, input }) => {
            const result = await prisma.directMessage.updateMany({
                where: {
                    id: input.messageId,
                    author_id: ctx.session.user.id,
                    receiver_id: input.userId,
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

            await channels.dm.message_updated.publish(
                [input.userId, ctx.session.user.id],
                {
                    id: input.messageId,
                    content: input.content,
                    author_id: ctx.session.user.id,
                    receiver_id: input.userId,
                }
            );
        }),
    delete: protectedProcedure
        .input(
            z.object({
                messageId: z.number(),
                userId: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const result = await prisma.directMessage.deleteMany({
                where: {
                    id: input.messageId,
                    author_id: ctx.session.user.id,
                    receiver_id: input.userId,
                },
            });

            if (result.count === 0)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "No permission or message doesn't exist",
                });

            await channels.dm.message_deleted.publish(
                [input.userId, ctx.session.user.id],
                {
                    id: input.messageId,
                    author_id: ctx.session.user.id,
                    receiver_id: input.userId,
                }
            );
        }),
    type: protectedProcedure
        .input(
            z.object({
                userId: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const user = await prisma.user.findUnique({
                where: {
                    id: ctx.session.user.id,
                },
            });

            if (user == null)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "User not found",
                });

            await channels.dm.typing.publish(
                [ctx.session.user.id, input.userId],
                {
                    user,
                }
            );
        }),
});

async function initChannel(user1: string, user2: string) {
    try {
        await prisma.directMessageChannel.createMany({
            data: [
                {
                    author_id: user1,
                    receiver_id: user2,
                },
                {
                    author_id: user2,
                    receiver_id: user1,
                },
            ],
        });
    } catch (e) {
        //ignore duplicated keys
    }
}
