import { TRPCError } from "@trpc/server";
import { channels } from "../ably";
import { z } from "zod";
import { protectedProcedure, router } from "./../trpc";
import { contentSchema } from "shared/schema/chat";
import { getLastRead, setLastRead } from "../redis/last-read";
import db from "db/client";
import { directMessageInfos, groups, messages, users } from "db/schema";
import { and, eq } from "drizzle-orm";
import { generateText } from "../eden";
import { onReceiveMessage } from "../inworld";
import { checkChannelPermissions } from "../utils/permissions";
import { pick } from "shared/common";
import { createMessage, fetchMessages, messageSchema } from "../utils/messages";

const userProfileKeys = ["id", "name", "image"] as const;

export const chatRouter = router({
    send: protectedProcedure
        .input(messageSchema)
        .mutation(async ({ input, ctx }) => {
            const { message, is_new_dm, data } = await db.transaction(
                async () => {
                    const { type, data } = await checkChannelPermissions(
                        input.channelId,
                        ctx.session
                    );

                    const message = await createMessage(
                        input,
                        ctx.session.user.id
                    );

                    let is_new_dm = false;

                    if (type === "dm") {
                        const result = await db
                            .update(directMessageInfos)
                            .set({
                                open: true,
                            })
                            .where(
                                and(
                                    eq(
                                        directMessageInfos.channel_id,
                                        input.channelId
                                    ),
                                    eq(directMessageInfos.open, false)
                                )
                            );
                        is_new_dm = result.rowsAffected !== 0;
                    }

                    return {
                        message: {
                            ...message,
                            nonce: input.nonce,
                        },
                        is_new_dm,
                        data: type === "dm" ? data : null,
                    };
                }
            );

            if (data != null && is_new_dm) {
                await channels.private.open_dm.publish([data.to_user_id], {
                    id: data.channel_id,
                    user: message.author,
                    unread_messages: 0,
                    last_message: message,
                });
            }

            await channels.chat.message_sent.publish(
                [input.channelId],
                message
            );

            setLastRead(
                input.channelId,
                ctx.session.user.id,
                message.timestamp
            );

            if (input.content.startsWith("@Shark")) {
                await onReceiveMessage({
                    content: input.content,
                    channel_id: input.channelId,
                    user_name: message.author.name,
                });
            }

            return message;
        }),
    messages: protectedProcedure
        .input(
            z.object({
                channelId: z.string(),
                count: z.number().min(0).max(50).default(50),
                cursorType: z.enum(["after", "before"]).default("before"),
                /** 
                the message id
                */
                cursor: z.number().optional(),
            })
        )
        .query(async ({ input, ctx }) => {
            await checkChannelPermissions(input.channelId, ctx.session);

            return await fetchMessages(
                input.channelId,
                input.count,
                input.cursor != null && input.cursorType === "after"
                    ? input.cursor
                    : undefined,
                input.cursor != null && input.cursorType === "before"
                    ? input.cursor
                    : undefined
            );
        }),
    update: protectedProcedure
        .input(
            z.object({
                messageId: z.number(),
                channelId: z.string(),
                content: contentSchema,
            })
        )
        .mutation(async ({ ctx, input }) => {
            const rows = await db
                .update(messages)
                .set({
                    content: input.content,
                })
                .where(
                    and(
                        eq(messages.id, input.messageId),
                        eq(messages.author_id, ctx.session.user.id),
                        eq(messages.channel_id, input.channelId)
                    )
                );

            if (rows.rowsAffected === 0)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "No permission or message doesn't exist",
                });

            await channels.chat.message_updated.publish([input.channelId], {
                id: input.messageId,
                content: input.content,
                channel_id: input.channelId,
            });
        }),
    delete: protectedProcedure
        .input(
            z.object({
                messageId: z.number(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { channel_id } = await checkDeleteMessage(
                input.messageId,
                ctx.session.user.id
            );

            await db.delete(messages).where(eq(messages.id, input.messageId));
            await channels.chat.message_deleted.publish([channel_id], {
                id: input.messageId,
                channel_id,
            });
        }),
    read: protectedProcedure
        .input(z.object({ channelId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            await setLastRead(
                input.channelId,
                ctx.session.user.id,
                new Date(Date.now())
            );
        }),
    checkout: protectedProcedure
        .input(
            z.object({
                channelId: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const old = await getLastRead(input.channelId, ctx.session.user.id);

            await setLastRead(
                input.channelId,
                ctx.session.user.id,
                new Date(Date.now())
            );

            return { last_read: old };
        }),
    type: protectedProcedure
        .input(
            z.object({
                channelId: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const user = await db
                .select(pick(users, ...userProfileKeys))
                .from(users)
                .where(eq(users.id, ctx.session.user.id))
                .then((res) => res[0]);

            if (user == null)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "User not found",
                });

            await channels.chat.typing.publish([input.channelId], {
                user,
            });
        }),
    generateText: protectedProcedure
        .input(z.object({ text: z.string().trim().min(0) }))
        .mutation(async ({ input }) => {
            return {
                text: await generateText(input.text),
            };
        }),
});

async function checkDeleteMessage(messageId: number, user: string) {
    const message = await db
        .select({
            author_id: messages.author_id,
            channel_id: messages.channel_id,
        })
        .from(messages)
        .where(eq(messages.id, messageId))
        .limit(1)
        .then((res) => res[0]);

    if (message == null)
        throw new TRPCError({
            code: "NOT_FOUND",
            message: "Message not found",
        });

    if (message.author_id === user) {
        return { channel_id: message.channel_id };
    }

    const group_rows = await db
        .select({ owner: groups.owner_id })
        .from(groups)
        .where(eq(groups.channel_id, message.channel_id))
        .limit(1);

    if (group_rows.length !== 0 && group_rows[0].owner === user) {
        return { channel_id: message.channel_id };
    }

    throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Missing required permission",
    });
}
