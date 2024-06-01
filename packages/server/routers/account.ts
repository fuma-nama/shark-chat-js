import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import db from "db/client";
import { users } from "db/schema";
import { eq } from "drizzle-orm";
import { pick } from "shared/common";
import { authAdapter } from "../auth/nextauth-adapter";
import { updateProfileSchema } from "shared/schema/user";

export const accountRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const profile = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.session.user.id))
      .then((res) => res?.[0]);

    if (profile == null) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not found",
      });
    }

    return profile;
  }),
  profile: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const res = await db
        .select({
          ...pick(users, "name", "image", "id", "banner_hash"),
        })
        .from(users)
        .where(eq(users.id, input.userId))
        .then((res) => res[0]);

      if (res == null)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User doesn't exist",
        });

      return res;
    }),
  updateProfile: protectedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      const updated = await db
        .update(users)
        .set({
          name: input.name,
          image: input.avatar_url,
          banner_hash: input.banner_hash,
        })
        .where(eq(users.id, userId))
        .returning();

      if (updated.length === 0)
        throw new TRPCError({
          code: "UNAUTHORIZED",
        });

      return updated[0];
    }),
  delete: protectedProcedure.mutation(async ({ ctx }) => {
    await authAdapter.deleteUser!(ctx.session.user.id);
  }),
});
