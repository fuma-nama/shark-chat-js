import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import db from "../db/client";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

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
    updateProfile: protectedProcedure
        .input(
            z.object({
                name: z.string().optional(),
                avatar_url: z.string().optional(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const userId = ctx.session.user.id;
            await db
                .update(users)
                .set({
                    name: input.name ?? undefined,
                    image: input.avatar_url ?? undefined,
                })
                .where(eq(users.id, userId));

            return await db
                .select()
                .from(users)
                .where(eq(users.id, userId))
                .then((res) => res?.[0]);
        }),
});
