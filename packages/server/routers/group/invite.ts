import { protectedProcedure, router } from "../../trpc";
import { z } from "zod";
import { getMembership } from "../../utils/permissions";
import { GroupInvite, groupInvites } from "db/schema";
import db from "db/client";
import { and, eq } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { TRPCError } from "@trpc/server";

/**
 * Only the group owner can manage invites
 */
export const inviteRouter = router({
  get: protectedProcedure
    .input(
      z.object({
        groupId: z.number(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const member = await getMembership(input.groupId, ctx.session.user.id);
      if (!member.owner && !member.admin)
        throw new TRPCError({
          message: "Admin only",
          code: "UNAUTHORIZED",
        });

      return db
        .select()
        .from(groupInvites)
        .where(eq(groupInvites.group_id, input.groupId));
    }),
  create: protectedProcedure
    .input(z.object({ groupId: z.number() }))
    .mutation<GroupInvite>(async ({ input, ctx }) => {
      const member = await getMembership(input.groupId, ctx.session.user.id);
      if (!member.owner && !member.admin)
        throw new TRPCError({
          message: "Admin only",
          code: "UNAUTHORIZED",
        });

      const code = uuid();
      await db.insert(groupInvites).values({
        group_id: input.groupId,
        code,
      });

      return {
        group_id: input.groupId,
        code,
      };
    }),
  delete: protectedProcedure
    .input(z.object({ groupId: z.number(), code: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const member = await getMembership(input.groupId, ctx.session.user.id);
      if (!member.owner && !member.admin)
        throw new TRPCError({
          message: "Admin only",
          code: "UNAUTHORIZED",
        });

      await db
        .delete(groupInvites)
        .where(
          and(
            eq(groupInvites.code, input.code),
            eq(groupInvites.group_id, input.groupId),
          ),
        );
    }),
});
