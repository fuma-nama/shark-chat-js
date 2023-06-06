import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import db from "../db/client";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { update } from "../db/utils";
import { pick } from "@/utils/common";

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
                    ...pick(users, "name", "image", "id"),
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
        .input(
            z.object({
                name: z.string().optional(),
                avatar_url: z.string().optional(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const userId = ctx.session.user.id;

            await update(users, {
                name: input.name ?? undefined,
                image: input.avatar_url ?? undefined,
            }).where(eq(users.id, userId));

            return await db
                .select()
                .from(users)
                .where(eq(users.id, userId))
                .then((res) => res?.[0]);
        }),
});
