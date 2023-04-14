import { TRPCError } from "@trpc/server";
import { channels } from "@/server/ably";
import { z } from "zod";
import { protectedProcedure, router } from "./../trpc";
import { contentSchema } from "../schema/chat";
import { checkIsMemberOf } from "@/utils/trpc/permissions";
import { onReceiveMessage } from "../inworld";
import { getLastRead, setLastRead } from "../redis/last-read";
import db from "../db/client";
import { groups, messages, users } from "../db/schema";
import { and, desc, eq, gt, lt } from "drizzle-orm";
import { update, userSelect } from "../db/utils";

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
            const message = await db.transaction(async () => {
                await checkIsMemberOf(input.groupId, ctx.session);
                const insertResult = await db.insert(messages).values({
                    author_id: ctx.session.user.id,
                    content: input.message,
                    group_id: input.groupId,
                });

                const message = await db
                    .select({
                        ...(messages as typeof messages._.columns),
                        author: userSelect,
                    })
                    .from(messages)
                    .where(eq(messages.id, Number(insertResult.insertId)))
                    .innerJoin(users, eq(users.id, messages.author_id))
                    .then((res) => res[0]);

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
            const count = Math.min(input.count, 50);

            return await db
                .select({
                    ...(messages as typeof messages._.columns),
                    author: userSelect,
                })
                .from(messages)
                .where(
                    and(
                        eq(messages.group_id, input.groupId),
                        input.cursor != null && input.cursorType === "after"
                            ? gt(messages.timestamp, new Date(input.cursor))
                            : undefined,
                        input.cursor != null && input.cursorType === "before"
                            ? lt(messages.timestamp, new Date(input.cursor))
                            : undefined
                    )
                )
                .leftJoin(users, eq(users.id, messages.author_id))
                .orderBy(desc(messages.timestamp))
                .limit(count);
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
            const rows = await update(messages, {
                content: input.content,
            }).where(
                and(
                    eq(messages.id, input.messageId),
                    eq(messages.author_id, ctx.session.user.id),
                    eq(messages.group_id, input.groupId)
                )
            );

            if (rows.rowsAffected === 0)
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
    delete: protectedProcedure
        .input(
            z.object({
                messageId: z.number(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const message = await db
                .select({
                    author_id: messages.author_id,
                    group_id: messages.group_id,
                })
                .from(messages)
                .where(eq(messages.id, input.messageId))
                .then((res) => res[0]);

            if (message == null)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Message not found",
                });

            const group = await db
                .select({ owner: groups.owner_id })
                .from(groups)
                .where(eq(groups.id, message.group_id))
                .then((res) => res[0]);

            const allowed =
                message.author_id === ctx.session.user.id ||
                (group != null && group.owner === ctx.session.user.id);

            if (!allowed) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Missing required permission",
                });
            }

            await db.delete(messages).where(eq(messages.id, input.messageId));
            await channels.chat.message_deleted.publish([message.group_id], {
                id: input.messageId,
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
            const user = await db
                .select(userSelect)
                .from(users)
                .where(eq(users.id, ctx.session.user.id))
                .then((res) => res[0]);

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
