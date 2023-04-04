import { TRPCError } from "@trpc/server";
import prisma from "@/server/prisma";
import { channels } from "@/utils/ably";
import { z } from "zod";
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
            const message = await prisma.$transaction(async () => {
                await checkIsMemberOf(input.groupId, ctx.session);

                const message = await prisma.message.create({
                    data: {
                        author_id: ctx.session.user.id,
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

                await setLastRead(
                    input.groupId,
                    ctx.session.user.id,
                    message.timestamp
                );

                return message;
            });

            await channels.chat.message_sent.publish([input.groupId], message);
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
            return setLastRead(
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
            const old = await prisma.member.findUnique({
                select: {
                    last_read: true,
                },
                where: {
                    group_id_user_id: {
                        group_id: input.groupId,
                        user_id: ctx.session.user.id,
                    },
                },
            });

            await setLastRead(
                input.groupId,
                ctx.session.user.id,
                new Date(Date.now())
            );

            return old;
        }),
    type: protectedProcedure
        .input(
            z.object({
                groupId: z.number(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await checkIsMemberOf(input.groupId, ctx.session);
            const user = await prisma.user.findUnique({
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

async function setLastRead(groupId: number, userId: string, value: Date) {
    return await prisma.member.update({
        where: {
            group_id_user_id: {
                user_id: userId,
                group_id: groupId,
            },
        },
        data: {
            last_read: value,
        },
    });
}
