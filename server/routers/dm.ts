import { protectedProcedure } from "./../trpc";
import { router } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { channels } from "@/server/ably";
import {
    RecentChatType,
    contentSchema,
    uploadAttachmentSchema,
} from "../schema/chat";
import {
    getDMLastRead,
    getDMLastReads,
    setDMLastRead,
} from "../redis/last-read";
import { getLastMessage, setLastMessage } from "../redis/dm-last-message";
import db from "../db/client";
import {
    attachments,
    directMessageChannels,
    directMessages,
    users,
} from "@/drizzle/schema";
import { and, desc, eq, gt, lt, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { attachmentSelect, requireOne, update, userSelect } from "../db/utils";
import { insertAttachment } from "./chat";

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
            const target_user = await db
                .select(userSelect)
                .from(users)
                .where(eq(users.id, input.userId))
                .then((res) => res[0]);

            if (target_user == null)
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "User not found",
                });
            return target_user;
        }),
    channels: protectedProcedure.query(async ({ ctx }) => {
        const channels = await db
            .select({
                receiver: userSelect,
            })
            .from(directMessageChannels)
            .where(eq(directMessageChannels.author_id, ctx.session.user.id))
            .innerJoin(users, eq(directMessageChannels.receiver_id, users.id));

        const lastReads = await getDMLastReads(
            channels.map((c) => [ctx.session.user.id, c.receiver.id])
        );

        return await db.transaction(
            async () => {
                const result = channels.map(async (channel, i) => {
                    const last_read = lastReads[i];

                    const unread_messages = await db
                        .select({
                            count: sql<string>`count(*)`,
                        })
                        .from(directMessages)
                        .where(
                            and(
                                or(
                                    and(
                                        eq(
                                            directMessages.receiver_id,
                                            channel.receiver.id
                                        ),
                                        eq(
                                            directMessages.author_id,
                                            ctx.session.user.id
                                        )
                                    ),
                                    and(
                                        eq(
                                            directMessages.receiver_id,
                                            ctx.session.user.id
                                        ),
                                        eq(
                                            directMessages.author_id,
                                            channel.receiver.id
                                        )
                                    )
                                ),
                                last_read != null
                                    ? gt(directMessages.timestamp, last_read)
                                    : undefined
                            )
                        );

                    return {
                        author_id: ctx.session.user.id,
                        receiver_id: channel.receiver.id,
                        receiver: channel.receiver,
                        unread_messages: Number(unread_messages[0].count),
                        last_message: await getLastMessage(
                            ctx.session.user.id,
                            channel.receiver.id
                        ),
                    };
                });

                return Promise.all<Promise<RecentChatType>>(result);
            },
            {
                accessMode: "read only",
                isolationLevel: "read committed",
            }
        );
    }),
    send: protectedProcedure
        .input(
            z.object({
                userId: z.string(),
                content: contentSchema,
                nonce: z.number().optional(),
                attachment: uploadAttachmentSchema.optional(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const userId = ctx.session.user.id;

            const message = await db.transaction(async () => {
                await initChannel(input.userId, userId);
                const attachment = await insertAttachment(input.attachment);
                const message_id = await db
                    .insert(directMessages)
                    .values({
                        author_id: userId,
                        content: input.content,
                        receiver_id: input.userId,
                        attachment_id: attachment?.id ?? null,
                    })
                    .then((res) => Number(res.insertId));

                const receiver = alias(users, "receiver");
                const author = alias(users, "author");
                const message = await db
                    .select({
                        ...(directMessages as typeof directMessages._.columns),
                        receiver: {
                            name: receiver.name,
                            id: receiver.id,
                            image: receiver.image,
                        },
                        author: {
                            name: author.name,
                            id: author.id,
                            image: author.image,
                        },
                    })
                    .from(directMessages)
                    .where(eq(directMessages.id, message_id))
                    .innerJoin(author, eq(directMessages.author_id, author.id))
                    .innerJoin(
                        receiver,
                        eq(directMessages.receiver_id, receiver.id)
                    )
                    .then(requireOne);

                return {
                    ...message,
                    attachment,
                    nonce: input.nonce,
                };
            });

            await setLastMessage(userId, input.userId, input.content);
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
            const count = Math.min(input.count, 50);

            return await db
                .select({
                    ...(directMessages as typeof directMessages._.columns),
                    author: userSelect,
                    attachment: attachmentSelect,
                })
                .from(directMessages)
                .leftJoin(users, eq(directMessages.author_id, users.id))
                .leftJoin(
                    attachments,
                    eq(attachments.id, directMessages.attachment_id)
                )
                .where(
                    and(
                        or(
                            and(
                                eq(directMessages.receiver_id, input.userId),
                                eq(
                                    directMessages.author_id,
                                    ctx.session.user.id
                                )
                            ),
                            and(
                                eq(
                                    directMessages.receiver_id,
                                    ctx.session.user.id
                                ),
                                eq(directMessages.author_id, input.userId)
                            )
                        ),
                        input.cursor != null && input.cursorType === "after"
                            ? gt(
                                  directMessages.timestamp,
                                  new Date(input.cursor)
                              )
                            : undefined,
                        input.cursor != null && input.cursorType === "before"
                            ? lt(
                                  directMessages.timestamp,
                                  new Date(input.cursor)
                              )
                            : undefined
                    )
                )
                .orderBy(desc(directMessages.timestamp))
                .limit(count);
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
            const result = await update(directMessages, {
                content: input.content,
            }).where(
                and(
                    eq(directMessages.id, input.messageId),
                    eq(directMessages.author_id, ctx.session.user.id),
                    eq(directMessages.receiver_id, input.userId)
                )
            );

            if (result.rowsAffected === 0)
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
            const result = await db
                .delete(directMessages)
                .where(
                    and(
                        eq(directMessages.id, input.messageId),
                        eq(directMessages.author_id, ctx.session.user.id),
                        eq(directMessages.receiver_id, input.userId)
                    )
                );

            if (result.rowsAffected === 0)
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
            const rows = await db
                .select(userSelect)
                .from(users)
                .where(eq(users.id, ctx.session.user.id));

            if (rows.length === 0)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "User not found",
                });

            await channels.dm.typing.publish(
                [ctx.session.user.id, input.userId],
                {
                    user: rows[0],
                }
            );
        }),
    close: protectedProcedure
        .input(z.object({ userId: z.string() }))
        .mutation(async ({ input, ctx }) => {
            const res = await db
                .delete(directMessageChannels)
                .where(
                    and(
                        eq(directMessageChannels.receiver_id, input.userId),
                        eq(directMessageChannels.author_id, ctx.session.user.id)
                    )
                );

            if (res.rowsAffected === 0) return;
            await channels.private.close_dm.publish([ctx.session.user.id], {
                userId: input.userId,
            });
        }),
});

async function initChannel(user1: string, user2: string) {
    try {
        await db
            .insert(directMessageChannels)
            .ignore()
            .values([
                {
                    author_id: user1,
                    receiver_id: user2,
                },
                {
                    author_id: user2,
                    receiver_id: user1,
                },
            ]);
    } catch (e) {
        //ignore duplicated keys
    }
}
