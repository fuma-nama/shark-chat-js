import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import { checkIsOwnerOf, getMembership } from "../../utils/permissions";
import { inviteRouter } from "./invite";
import { createGroupSchema, updateGroupSchema } from "shared/schema/group";
import { membersRouter } from "./members";
import { publish } from "../../ably";
import { getLastReads } from "../../redis/last-read";
import db from "db/client";
import { createId } from "@paralleldrive/cuid2";
import {
  Group,
  groupInvites,
  groups,
  members,
  messageChannels,
  messages,
} from "db/schema";
import { and, desc, eq, gt, sql } from "drizzle-orm";
import { requireOne } from "db/utils";
import { pick } from "shared/common";

export interface GroupWithNotifications extends Group {
  last_message: { content: string } | null;
  member: {
    admin: boolean;
  };
  unread_messages: number;

  /**
   * The last reading time
   */
  last_read?: number;
}

export const groupRouter = router({
  create: protectedProcedure
    .input(createGroupSchema)
    .mutation<Group>(({ ctx, input }) => {
      return db.transaction(async () => {
        const group_id = createId();
        const channel_id = createId();

        const [result] = await Promise.all([
          db
            .insert(groups)
            .values({
              id: group_id,
              channel_id,
              name: input.name,
              owner_id: ctx.session.user.id,
              unique_name: group_id,
            })
            .returning(),
          db.insert(messageChannels).values({
            id: channel_id,
            group_id,
            type: "GROUP",
          }),
        ]);

        await joinMember(result[0], ctx.session.user.id);
        return result[0];
      });
    }),
  all: protectedProcedure.query<GroupWithNotifications[]>(async ({ ctx }) => {
    try {
      return await getGroupsWithNotifications(ctx.session.user.id);
    } catch (e) {
      console.error(e);
      throw e;
    }
  }),
  info: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const member = await db
        .select({ group: groups })
        .from(members)
        .where(
          and(
            eq(members.group_id, input.groupId),
            eq(members.user_id, ctx.session.user.id),
          ),
        )
        .innerJoin(groups, eq(members.group_id, groups.id))
        .limit(1)
        .then((res) => res[0]);

      if (!member) {
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
      }),
    )
    .mutation<Group>(async ({ ctx, input }) => {
      const invites = await db
        .select()
        .from(groupInvites)
        .where(eq(groupInvites.code, input.code))
        .innerJoin(groups, eq(groupInvites.group_id, groups.id));

      if (invites.length === 0)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invite not found",
        });

      await joinMember(invites[0].Group, ctx.session.user.id);

      return invites[0].Group;
    }),
  joinByUniqueName: protectedProcedure
    .input(
      z.object({
        uniqueName: z.string(),
      }),
    )
    .mutation<Group>(async ({ ctx, input }) => {
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

      await joinMember(group, ctx.session.user.id);

      return group;
    }),
  update: protectedProcedure
    .input(updateGroupSchema)
    .mutation(async ({ ctx, input: { groupId, ...input } }) => {
      const member = await getMembership(groupId, ctx.session.user.id);
      if (!member.admin && !member.owner)
        throw new TRPCError({
          message: "Admin only",
          code: "UNAUTHORIZED",
        });

      await Promise.all([
        db.update(groups).set(input).where(eq(groups.id, groupId)),
        publish("group", [groupId], {
          type: "group_updated",
          data: {
            groupId,
            group: input,
          },
        }),
      ]);
    }),
  delete: protectedProcedure
    .input(z.object({ groupId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const res = await checkIsOwnerOf(input.groupId, ctx.session);

      await db.transaction(async () => {
        await db.delete(groups).where(eq(groups.id, input.groupId));

        await db
          .delete(messages)
          .where(eq(messages.channel_id, res[0].channel_id));

        await db.delete(members).where(eq(members.group_id, input.groupId));

        await db
          .delete(groupInvites)
          .where(eq(groupInvites.group_id, input.groupId));
      });

      await publish("group", [input.groupId], {
        type: "group_deleted",
        data: {
          id: input.groupId,
        },
      });
    }),
  leave: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
      }),
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
            eq(members.user_id, ctx.session.user.id),
          ),
        );

      await publish("private", [ctx.session.user.id], {
        type: "group_removed",
        data: {
          id: input.groupId,
        },
      });
    }),
  invite: inviteRouter,
  member: membersRouter,
});

async function joinMember(group: Group, userId: string) {
  const res = await db
    .insert(members)
    .values({
      group_id: group.id,
      user_id: userId,
    })
    .onConflictDoNothing();

  if (res.rowCount !== 0) {
    await publish("private", [userId], {
      type: "group_created",
      data: {
        ...group,
        last_message: null,
        member: { admin: false },
        unread_messages: 0,
      },
    });
  }
}

async function getGroupsWithNotifications(
  userId: string,
): Promise<GroupWithNotifications[]> {
  const result = await db
    .select({
      group: groups,
      member: pick(members, "admin"),
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
    result.map((row) => [row.group.channel_id, userId]),
  );

  return await db.transaction(
    async () => {
      const groups = result.map(async ({ group, member, last_message }, i) => {
        const last_read = last_reads[i];
        const result = await db
          .select({
            count: sql<string>`count(*)`,
          })
          .from(messages)
          .where(
            and(
              eq(messages.channel_id, group.channel_id),
              last_read != null ? gt(messages.timestamp, last_read) : undefined,
            ),
          )
          .then((res) => requireOne(res));

        return {
          ...group,
          member,
          last_message,
          last_read: last_read?.getTime(),
          unread_messages: Number(result.count),
        };
      });

      return await Promise.all(groups);
    },
    {
      isolationLevel: "read committed",
      accessMode: "read only",
    },
  );
}
