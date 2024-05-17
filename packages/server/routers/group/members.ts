import { protectedProcedure, router } from "../../trpc";
import { channels } from "../../ably";
import {
  checkIsMemberOf,
  checkIsOwnerOf,
  getMembership,
} from "../../utils/permissions";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import db from "db/client";
import { Member, members, users } from "db/schema";
import { and, eq } from "drizzle-orm";
import type { UserProfile } from "../chat";

export interface MemberWithUser extends Member {
  user: UserProfile;
}

export const membersRouter = router({
  get: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
      }),
    )
    .query<MemberWithUser[]>(async ({ ctx, input }) => {
      await checkIsMemberOf(input.groupId, ctx.session);

      return db
        .select({
          ...(members as typeof members._.columns),
          user: {
            name: users.name,
            id: users.id,
            image: users.image,
          },
        })
        .from(members)
        .where(eq(members.group_id, input.groupId))
        .innerJoin(users, eq(users.id, members.user_id));
    }),
  kick: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const member = await getMembership(input.groupId, ctx.session.user.id);
      if (!member.admin && !member.owner)
        throw new TRPCError({
          message: "Admin only",
          code: "UNAUTHORIZED",
        });

      const target = await getMembership(input.groupId, input.userId);

      const allowed =
        // Owner
        (member.owner && ctx.session.user.id !== input.userId) ||
        // Admin
        (member.admin && !target.owner && !target.admin);

      if (!allowed)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You can't kick the owner or admin of group",
        });

      await db
        .delete(members)
        .where(
          and(
            eq(members.group_id, input.groupId),
            eq(members.user_id, input.userId),
          ),
        );

      await channels.private.group_removed.publish([input.userId], {
        id: input.groupId,
      });
    }),
  update: protectedProcedure
    .input(
      z.object({
        groupId: z.string(),
        userId: z.string(),
        admin: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await checkIsOwnerOf(input.groupId, ctx.session);

      if (input.admin === undefined) return;

      await db
        .update(members)
        .set({
          admin: input.admin,
        })
        .where(
          and(
            eq(members.group_id, input.groupId),
            eq(members.user_id, input.userId),
          ),
        );
    }),
});
