import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import { checkIsOwnerOf } from "@/utils/trpc/permissions";
import { inviteRouter } from "./invite";
import {
    createGroupSchema,
    GroupWithNotifications,
    updateGroupSchema,
} from "../../schema/group";
import { membersRouter } from "./members";
import { channels } from "@/server/ably";
import { getLastReads } from "@/server/redis/last-read";
import db from "@/server/db/client";
import { createId } from "@paralleldrive/cuid2";
import { groupInvites, groups, members, messages } from "@/drizzle/schema";
import { and, desc, eq, gt, sql } from "drizzle-orm";
import { requireOne } from "@/server/db/utils";

export const groupRouter = router({
    create: protectedProcedure
        .input(createGroupSchema)
        .mutation(({ ctx, input }) => {
            return db.transaction(async () => {
                const group_id = await db
                    .insert(groups)
                    .values({
                        name: input.name,
                        owner_id: ctx.session.user.id,
                        unique_name: createId(),
                    })
                    .then((res) => Number(res.insertId));

                await db.insert(members).values({
                    user_id: ctx.session.user.id,
                    group_id: group_id,
                });

                return await db
                    .select()
                    .from(groups)
                    .where(eq(groups.id, group_id))
                    .then((res) => requireOne(res));
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
            await checkIsOwnerOf(input.groupId, ctx.session);

            db.transaction(async () => {
                await db.delete(groups).where(eq(groups.id, input.groupId));

                await db
                    .delete(messages)
                    .where(eq(messages.channel_id, `g_${input.groupId}`));

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
    try {
        await db.insert(members).values({
            group_id: groupId,
            user_id: userId,
        });

        return await db
            .select()
            .from(groups)
            .where(eq(groups.id, groupId))
            .then((res) => requireOne(res));
    } catch (e) {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "You had been joined the group",
        });
    }
}

async function getGroupsWithNotifications(
    userId: string
): Promise<GroupWithNotifications[]> {
    const result = await db
        .select({
            group: groups,
        })
        .from(members)
        .innerJoin(groups, eq(groups.id, members.group_id))
        .where(eq(members.user_id, userId))
        .orderBy(desc(members.group_id));
    if (result.length === 0) return [];

    const last_reads = await getLastReads(
        result.map((row) => [`g_${row.group.id}`, userId])
    );

    return await db.transaction(
        async () => {
            const groups = result.map(async ({ group }, i) => {
                const last_read = last_reads[i];
                const result = await db
                    .select({
                        count: sql<string>`count(*)`,
                    })
                    .from(messages)
                    .where(
                        and(
                            eq(messages.channel_id, `g_${group.id}`),
                            last_read != null
                                ? gt(messages.timestamp, last_read)
                                : undefined
                        )
                    )
                    .then((res) => requireOne(res));

                return {
                    ...group,
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
