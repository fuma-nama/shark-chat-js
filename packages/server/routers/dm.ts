import { protectedProcedure, router } from "../trpc";
import db from "db/client";
import {
    messageChannels,
    directMessageInfos,
    messages,
    users,
} from "db/schema";
import { and, eq, gt, sql } from "drizzle-orm";
import { getLastReads } from "../redis/last-read";
import { z } from "zod";
import { pick } from "shared/common";
import { TRPCError } from "@trpc/server";
import { createId } from "@paralleldrive/cuid2";
import { requireOne } from "db/utils";
import { channels } from "../ably";

export const dmRouter = router({
    info: protectedProcedure
        .input(z.object({ channelId: z.string() }))
        .query(async ({ input, ctx }) => {
            const res = await db
                .select({
                    id: directMessageInfos.channel_id,
                    user: pick(users, "name", "image", "id"),
                })
                .from(directMessageInfos)
                .where(
                    and(
                        eq(directMessageInfos.channel_id, input.channelId),
                        eq(directMessageInfos.user_id, ctx.session.user.id),
                        eq(directMessageInfos.open, true)
                    )
                )
                .innerJoin(users, eq(users.id, directMessageInfos.to_user_id));

            if (res.length === 0) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Channel not found",
                });
            }
            return res[0];
        }),
    channels: protectedProcedure.query(async ({ ctx }) => {
        const channels = await db
            .select({
                id: directMessageInfos.channel_id,
                user: pick(users, "name", "image", "id"),
                last_message: pick(messages, "content"),
            })
            .from(directMessageInfos)
            .where(
                and(
                    eq(directMessageInfos.user_id, ctx.session.user.id),
                    eq(directMessageInfos.open, true)
                )
            )
            .innerJoin(users, eq(directMessageInfos.to_user_id, users.id))
            .innerJoin(
                messageChannels,
                eq(messageChannels.id, directMessageInfos.channel_id)
            )
            .leftJoin(
                messages,
                eq(messages.id, messageChannels.last_message_id)
            );

        if (channels.length === 0) return [];
        const lastReads = await getLastReads(
            channels.map((c) => [c.id, ctx.session.user.id])
        );

        return await db.transaction(
            async () => {
                const result = channels.map(async (channel, i) => {
                    const last_read = lastReads[i];

                    const unread_messages = await db
                        .select({
                            count: sql<string>`count(*)`,
                        })
                        .from(messages)
                        .where(
                            and(
                                eq(messages.channel_id, channel.id),
                                last_read != null
                                    ? gt(messages.timestamp, last_read)
                                    : undefined
                            )
                        );

                    return {
                        ...channel,
                        unread_messages: Number(unread_messages[0].count),
                    };
                });

                return Promise.all(result);
            },
            {
                accessMode: "read only",
                isolationLevel: "read committed",
            }
        );
    }),
    open: protectedProcedure
        .input(z.object({ userId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const res = await db
                .transaction(async () => {
                    const updated = await db
                        .update(directMessageInfos)
                        .set({ open: true })
                        .where(
                            and(
                                eq(directMessageInfos.to_user_id, input.userId),
                                eq(
                                    directMessageInfos.user_id,
                                    ctx.session.user.id
                                )
                            )
                        );

                    if (updated.rowsAffected === 0) {
                        const id = createId();

                        await Promise.all([
                            db.insert(messageChannels).ignore().values({
                                id,
                            }),
                            db.insert(directMessageInfos).ignore().values({
                                channel_id: id,
                                user_id: ctx.session.user.id,
                                to_user_id: input.userId,
                            }),
                            db.insert(directMessageInfos).ignore().values({
                                channel_id: id,
                                user_id: input.userId,
                                to_user_id: ctx.session.user.id,
                            }),
                        ]);
                    }

                    return await db
                        .select({
                            id: directMessageInfos.channel_id,
                            user: users,
                        })
                        .from(directMessageInfos)
                        .where(
                            and(
                                eq(directMessageInfos.to_user_id, input.userId),
                                eq(
                                    directMessageInfos.user_id,
                                    ctx.session.user.id
                                )
                            )
                        )
                        .innerJoin(
                            users,
                            eq(users.id, directMessageInfos.to_user_id)
                        )
                        .limit(1);
                })
                .then((res) => requireOne(res));

            await channels.private.open_dm.publish([ctx.session.user.id], {
                ...res,
                last_message: null,
                unread_messages: 0,
            });

            return res;
        }),
    close: protectedProcedure
        .input(z.object({ channelId: z.string() }))
        .mutation(async ({ input, ctx }) => {
            await db
                .update(directMessageInfos)
                .set({ open: false })
                .where(
                    and(
                        eq(directMessageInfos.user_id, ctx.session.user.id),
                        eq(directMessageInfos.channel_id, input.channelId)
                    )
                );

            await channels.private.close_dm.publish([ctx.session.user.id], {
                channel_id: input.channelId,
            });
        }),
});
