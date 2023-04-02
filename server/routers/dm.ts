import { protectedProcedure } from "./../trpc";
import { router } from "../trpc";
import { z } from "zod";
import prisma from "../prisma";
import { TRPCError } from "@trpc/server";
import { channels } from "@/utils/ably";
import { RecentChatType, contentSchema } from "../schema/chat";

const userSelect = {
    select: {
        image: true,
        name: true,
        id: true,
    },
} as const;

export const dmRouter = router({
    checkout: protectedProcedure
        .input(z.object({ userId: z.string() }))
        .query(({ ctx, input }) => {
            return prisma.$transaction(async () => {
                const old = await prisma.directMessageChannel.findUnique({
                    select: {
                        last_read: true,
                    },
                    where: {
                        author_id_receiver_id: {
                            author_id: ctx.session.user.id,
                            receiver_id: input.userId,
                        },
                    },
                });

                await setLastRead(
                    ctx.session.user.id,
                    input.userId,
                    new Date(Date.now())
                );
                return old;
            });
        }),
    read: protectedProcedure
        .input(z.object({ userId: z.string() }))
        .mutation(({ ctx, input }) => {
            return setLastRead(
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
                orderBy: {
                    last_read: "desc",
                },
            });

            const result = channels.map(async (channel) => {
                const conditions = [
                    {
                        author_id: channel.author_id,
                        receiver_id: channel.receiver_id,
                    },
                    {
                        author_id: channel.receiver_id,
                        receiver_id: channel.author_id,
                    },
                ];

                const unread_messages = await prisma.directMessage.count({
                    where: {
                        OR: conditions,
                        timestamp: {
                            gt: channel.last_read,
                        },
                    },
                });

                const last = await prisma.directMessage.findFirst({
                    select: {
                        content: true,
                    },
                    where: {
                        OR: conditions,
                    },
                    orderBy: {
                        timestamp: "desc",
                    },
                });

                return {
                    ...channel,
                    unread_messages,
                    last_message: last?.content ?? null,
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
            })
        )
        .mutation(async ({ input, ctx }) => {
            const userId = ctx.session.user.id;
            const message = await prisma.directMessage.create({
                data: {
                    author_id: userId,
                    content: input.message,
                    receiver_id: input.userId,
                },
                include: {
                    author: userSelect,
                },
            });

            await setLastRead(userId, input.userId, message.timestamp);
            await channels.dm.message_sent.publish(
                [input.userId, userId],
                message
            );

            return message;
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
            const userId = ctx.session.user.id;

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
                            author_id: userId,
                        },
                        {
                            receiver_id: userId,
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
});

async function setLastRead(authorId: string, receiverId: string, value: Date) {
    return await prisma.directMessageChannel.upsert({
        select: { last_read: true },
        create: {
            author_id: authorId,
            receiver_id: receiverId,
        },
        update: {
            last_read: value,
        },
        where: {
            author_id_receiver_id: {
                author_id: authorId,
                receiver_id: receiverId,
            },
        },
    });
}
