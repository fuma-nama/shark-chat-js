import { protectedProcedure, router } from "../../trpc";
import { channels } from "../../ably";
import { checkIsMemberOf, checkIsOwnerOf } from "../../utils/permissions";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import db from "db/client";
import { members, users } from "db/schema";
import { and, eq } from "drizzle-orm";

export const membersRouter = router({
  get: protectedProcedure
    .input(
      z.object({
        groupId: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await checkIsMemberOf(input.groupId, ctx.session);

      return await db
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
        groupId: z.number(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await checkIsOwnerOf(input.groupId, ctx.session);
      if (ctx.session.user.id === input.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You can't kick yourself",
        });
      }

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
});
