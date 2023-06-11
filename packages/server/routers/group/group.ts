import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import { checkIsOwnerOf } from "../../utils/permissions";
import { inviteRouter } from "./invite";
import { createGroupSchema, updateGroupSchema } from "shared/schema/group";
import { membersRouter } from "./members";
import { channels } from "../../ably";
import { getLastReads } from "../../redis/last-read";
import db from "db/client";
import { createId } from "@paralleldrive/cuid2";
import {
    groupInvites,
    groups,
    members,
    messageChannels,
    messages,
} from "db/schema";
import { and, desc, eq, gt, sql } from "drizzle-orm";
import { requireOne } from "db/utils";
import { pick } from "shared/common";

export const groupRouter = router({
    create: protectedProcedure
        .input(createGroupSchema)
        .mutation(({ ctx, input }) => {
            return db.transaction(async () => {
                const channel_id = createId();
                const group_id = await db
                    .insert(groups)
                    .values({
                        channel_id,
                        name: input.name,
                        owner_id: ctx.session.user.id,
                        unique_name: createId(),
                    })
                    .then((res) => Number(res.insertId));

                await db.insert(messageChannels).values({
                    id: channel_id,
                });

                return await joinMember(group_id, ctx.session.user.id);
            });
        }),
    all: protectedProcedure.query(({ ctx }) =>
        getGroupsWithNotifications(ctx.session.user.id)
    ),
    info: protectedProcedure
        .input(
            z.object({
                groupId: z.number(),
            })
        )
        .query(async ({ input, ctx }) => {
            const member = await db
                .select({ group: groups })
                .from(members)
                .where(
                    and(
                        eq(members.group_id, input.groupId),
                        eq(members.user_id, ctx.session.user.id)
                    )
                )
                .innerJoin(groups, eq(members.group_id, groups.id))
                .then((res) => res[0]);

            if (member == null) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "You aren't the member of this group yet",
                });
            }

            return member.group;
        }),
    join: protectedProcedure
        .input(
            z.object({
                code: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const invites = await db
                .select()
                .from(groupInvites)
                .where(eq(groupInvites.code, input.code));

            if (invites.length === 0)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Invite not found",
                });

            return await joinMember(invites[0].group_id, ctx.session.user.id);
        }),
    joinByUniqueName: protectedProcedure
        .input(
            z.object({
                uniqueName: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const group = await db
                .select()
                .from(groups)
                .where(eq(groups.unique_name, input.uniqueName))
                .then((res) => res[0]);

            if (group == null)
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Group not found",
                });

            if (!group.public)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "The group isn't a public group",
                });

            return await joinMember(group.id, ctx.session.user.id);
        }),
    update: protectedProcedure
        .input(updateGroupSchema)
        .mutation(async ({ ctx, input }) => {
            await checkIsOwnerOf(input.groupId, ctx.session);
            await db
                .update(groups)
                .set({
                    name: input.name,
                    icon_hash: input.icon_hash,
                    unique_name: input.unique_name,
                    public: input.public,
                })
                .where(eq(groups.id, input.groupId));

            const updated = await db
                .select()
                .from(groups)
                .where(eq(groups.id, input.groupId))
                .then((res) => requireOne(res));

            await channels.group.group_updated.publish(
                [input.groupId],
                updated
            );
            return updated;
        }),
    delete: protectedProcedure
        .input(z.object({ groupId: z.number() }))
        .mutation(async ({ ctx, input }) => {
            const res = await checkIsOwnerOf(input.groupId, ctx.session);

            db.transaction(async () => {
                await db.delete(groups).where(eq(groups.id, input.groupId));

                await db
                    .delete(messages)
                    .where(eq(messages.channel_id, res[0].channel_id));

                await db
                    .delete(members)
                    .where(eq(members.group_id, input.groupId));

                await db
                    .delete(groupInvites)
                    .where(eq(groupInvites.group_id, input.groupId));
            });

            await channels.group.group_deleted.publish([input.groupId], {
                id: input.groupId,
            });
        }),
    leave: protectedProcedure
        .input(
            z.object({
                groupId: z.number(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const group = await db
                .select({ owner_id: groups.owner_id })
                .from(groups)
                .where(eq(groups.id, input.groupId))
                .then((res) => res[0]);

            if (group == null)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Group doesn't exist",
                });
            if (group.owner_id === ctx.session.user.id)
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message:
                        "The group owner cannot leave the group, please transfer your permissions before leaving it",
                });

            await db
                .delete(members)
                .where(
                    and(
                        eq(members.group_id, input.groupId),
                        eq(members.user_id, ctx.session.user.id)
                    )
                );

            await channels.private.group_removed.publish(
                [ctx.session.user.id],
                {
                    id: input.groupId,
                }
            );
        }),
    invite: inviteRouter,
    member: membersRouter,
});

async function joinMember(groupId: number, userId: string) {
    await db.insert(members).ignore().values({
        group_id: groupId,
        user_id: userId,
    });

    const res = await db.select().from(groups).where(eq(groups.id, groupId));

    if (res.length === 0) return;

    await channels.private.group_created.publish([userId], {
        ...res[0],
        last_message: null,
        unread_messages: 0,
    });

    return res[0];
}

async function getGroupsWithNotifications(userId: string) {
    const result = await db
        .select({
            group: groups,
            last_message: pick(messages, "content"),
        })
        .from(members)
        .innerJoin(groups, eq(groups.id, members.group_id))
        .innerJoin(messageChannels, eq(groups.channel_id, messageChannels.id))
        .leftJoin(messages, eq(messageChannels.last_message_id, messages.id))
        .where(eq(members.user_id, userId))
        .orderBy(desc(members.group_id));

    if (result.length === 0) return [];

    const last_reads = await getLastReads(
        result.map((row) => [row.group.channel_id, userId])
    );

    return await db.transaction(
        async () => {
            const groups = result.map(async ({ group, last_message }, i) => {
                const last_read = last_reads[i];
                const result = await db
                    .select({
                        count: sql<string>`count(*)`,
                    })
                    .from(messages)
                    .where(
                        and(
                            eq(messages.channel_id, group.channel_id),
                            last_read != null
                                ? gt(messages.timestamp, last_read)
                                : undefined
                        )
                    )
                    .then((res) => requireOne(res));

                return {
                    ...group,
                    last_message,
                    unread_messages: Number(result.count),
                };
            });

            return await Promise.all(groups);
        },
        {
            isolationLevel: "read committed",
            accessMode: "read only",
        }
    );
}
